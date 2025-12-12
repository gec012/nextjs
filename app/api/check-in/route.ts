import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkInSchema, qrDataSchema } from '@/lib/validations';
import { validateQRData } from '@/lib/qr';
import { isWithinWindow } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = checkInSchema.parse(body);

        let userId: number;

        // 1. Identificar Usuario (DNI, QR, User ID)
        if (validatedData.qr_data) {
            try {
                const qrData = JSON.parse(validatedData.qr_data);
                const qrValidation = qrDataSchema.parse(qrData);
                const validation = validateQRData(qrValidation);
                if (!validation.valid) {
                    return errorResponse(validation.reason || 'QR inválido', 400);
                }
                userId = validation.userId!;
            } catch (error) {
                return errorResponse('Formato de QR inválido', 400);
            }
        } else if (validatedData.dni) {
            const user = await prisma.user.findFirst({
                where: { dni: validatedData.dni },
                select: { id: true },
            });
            if (!user) return errorResponse('Usuario no encontrado con ese DNI', 404);
            userId = user.id;
        } else if (validatedData.user_id) {
            userId = validatedData.user_id;
        } else {
            return errorResponse('Debes proporcionar user_id, dni o qr_data', 400);
        }

        // Obtener usuario
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) return errorResponse('Usuario no encontrado', 404);

        // =========================================================================
        // MODO AUTOMÁTICO (Sin disciplina seleccionada)
        // =========================================================================
        if (!validatedData.discipline_id) {

            const now = new Date();
            const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 min antes
            const windowEnd = new Date(now.getTime() + 20 * 60 * 1000);   // 20 min después

            // A) Buscar Reservas Confirmadas para AHORA
            const activeReservations = await prisma.reservation.findMany({
                where: {
                    userId,
                    status: 'ACTIVE',
                    attended: false,
                    class: {
                        startTime: { gte: windowStart, lte: windowEnd },
                    },
                },
                include: { class: { include: { discipline: true } }, membership: true },
            });

            if (activeReservations.length === 1) {
                // Caso Ideal: Tiene exactamente una clase ahora.
                return await processReservationCheckIn(activeReservations[0], user);
            }

            if (activeReservations.length > 1) {
                return NextResponse.json({
                    status: 'selection_required',
                    message: `Hola ${user.name}, tienes multiples clases ahora. ¿A cual entras?`,
                    options: activeReservations.map(r => ({
                        id: r.class.discipline.id,
                        name: r.class.discipline.name,
                        type: 'reservation',
                        detail: r.class.name
                    }))
                });
            }

            // B) Buscar Membresías Activas (Acceso Directo o Reservas futuras)
            const activeMemberships = await prisma.membership.findMany({
                where: {
                    userId,
                    status: 'ACTIVE',
                    expirationDate: { gte: now },
                },
                include: { discipline: true },
            });

            // Filtrar membresías útiles para "ahora" 
            // (Ej: Si es acceso directo y tiene crédito, sirve. Si es con reserva y no hay reserva, no sirve de mucho para entrar YA, salvo que sea Open Box)
            const validOptions = activeMemberships.filter(m => {
                // Si la disciplina no requiere reserva, es válida (Gimnasio, Musculación)
                if (!m.discipline.requiresReservation) return true;
                // Si requiere reserva y NO encontramos reserva arriba, entonces NO puede entrar solo con la membresía
                return false;
            });

            if (validOptions.length === 0) {

                // Verificar si tiene clases HOY pero fuera de horario
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const outOfWindowReservation = await prisma.reservation.findFirst({
                    where: {
                        userId,
                        status: 'ACTIVE',
                        attended: false,
                        class: {
                            startTime: { gte: todayStart, lte: todayEnd }
                        }
                    },
                    include: { class: { include: { discipline: true } } }
                });

                if (outOfWindowReservation) {
                    const classTime = new Date(outOfWindowReservation.class.startTime);
                    const now = new Date();
                    const diffMins = (classTime.getTime() - now.getTime()) / 60000;

                    if (diffMins > 20) { // Si falta más de 20 min (la ventana es 30, damos margen)
                        return errorResponse(`✋ Tu clase de ${outOfWindowReservation.class.discipline.name} es a las ${formatTime(classTime)}. Podrás ingresar 30 min antes.`, 400);
                    } else if (diffMins < -20) {
                        return errorResponse(`❌ Tu clase de ${outOfWindowReservation.class.discipline.name} (${formatTime(classTime)}) ya comenzó. El ingreso ha cerrado.`, 400);
                    }
                }

                // Puede ser que tenga membresías pero Sean de Clases (Requieren Reserva) y no reservó
                if (activeMemberships.length > 0) {
                    return errorResponse(`Hola ${user.name}, tus membresías requieren reservar clase previa.`, 400);
                }
                return errorResponse(`Hola ${user.name}, no tienes membresías activas.`, 400);
            }

            if (validOptions.length === 1) {
                // Caso Ideal: Solo tiene Musculación (o una sola activa)
                // Llamamos recursivamente o procesamos directo
                return await processDirectCheckIn(user, validOptions[0].disciplineId);
            }

            // Múltiples opciones válidas (Ej: Pase Libre Musculación + Pase Pileta)
            return NextResponse.json({
                status: 'selection_required',
                message: `Hola ${user.name}, ¿Qué vas a entrenar hoy?`,
                options: validOptions.map(m => ({
                    id: m.discipline.id,
                    name: m.discipline.name,
                    type: 'direct_access',
                    remaining: m.remainingCredits
                }))
            });
        }

        // =========================================================================
        // MODO MANUAL (Con disciplina seleccionada)
        // =========================================================================

        // Verificar si es Reserva o Acceso Directo para esta disciplina específica
        const discipline = await prisma.discipline.findUnique({ where: { id: validatedData.discipline_id } });
        if (!discipline) return errorResponse('Disciplina no encontrada', 404);

        // 1. Intentar buscar Reserva
        const now = new Date();
        const windowStart = new Date(now.getTime() - 30 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 20 * 60 * 1000);

        const reservation = await prisma.reservation.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                attended: false,
                class: {
                    disciplineId: discipline.id,
                    startTime: { gte: windowStart, lte: windowEnd },
                },
            },
            include: { class: { include: { discipline: true } }, membership: true },
        });

        if (reservation) {
            return await processReservationCheckIn(reservation, user);
        }

        // 2. Intentar Acceso Directo
        if (discipline.requiresReservation) {
            return errorResponse(`${discipline.name} requiere reservar turno previamente.`, 400);
        }

        return await processDirectCheckIn(user, discipline.id);

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json({ status: 'error', message: 'Datos inválidos', errors: error.errors }, { status: 400 });
        }
        console.error('Check-in error:', error);
        return errorResponse('Error interno del servidor', 500);
    }
}

// Helpers
function errorResponse(message: string, status: number) {
    return NextResponse.json({ status: 'error', message }, { status });
}

async function processReservationCheckIn(reservation: any, user: any) {
    await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
            where: { id: reservation.id },
            data: { attended: true },
        });
        await tx.attendance.create({
            data: {
                userId: user.id,
                disciplineId: reservation.class.disciplineId,
                membershipId: reservation.membershipId,
                type: 'reservation',
                checkInTime: new Date(),
            },
        });
        await tx.accessLog.create({
            data: {
                userId: user.id,
                accessType: 'dynamic',
                granted: true,
                reason: `Asistencia: ${reservation.class.name}`,
                disciplineName: reservation.class.discipline.name,
            },
        });
    });

    return NextResponse.json({
        status: 'success',
        message: `✅ Asistencia registrada para ${reservation.class.name}`,
        data: {
            discipline: reservation.class.discipline.name,
            remaining_credits: reservation.membership.remainingCredits,
            photo_url: user.profilePhoto,
            type: 'reservation',
        },
    });
}

async function processDirectCheckIn(user: any, disciplineId: number) {
    const membership = await prisma.membership.findFirst({
        where: {
            userId: user.id,
            disciplineId: disciplineId,
            status: 'ACTIVE',
            expirationDate: { gte: new Date() },
        },
        include: { discipline: true },
    });

    if (!membership) {
        // Fallback: Check if user has unlimited plan that covers this (logic simplified for now)
        return errorResponse(`${user.name} no tiene membresía activa para esta disciplina`, 402);
    }

    if (!membership.isUnlimited && membership.remainingCredits <= 0) {
        return errorResponse('Sin créditos disponibles', 402);
    }

    const result = await prisma.$transaction(async (tx) => {
        let updatedMembership = membership;
        if (!membership.isUnlimited) {
            updatedMembership = await tx.membership.update({
                where: { id: membership.id },
                data: { remainingCredits: { decrement: 1 } },
                include: { discipline: true },
            });
        }

        await tx.attendance.create({
            data: {
                userId: user.id,
                disciplineId,
                membershipId: membership.id,
                type: 'direct_access',
                checkInTime: new Date(),
            },
        });

        await tx.accessLog.create({
            data: {
                userId: user.id,
                accessType: 'dynamic',
                granted: true,
                reason: `Acceso Directo: ${membership.discipline.name}`,
                disciplineName: membership.discipline.name,
            },
        });

        return updatedMembership;
    });

    return NextResponse.json({
        status: 'success',
        message: `¡Bienvenido ${user.name}! Acceso a ${membership.discipline.name}`,
        data: {
            discipline: membership.discipline.name,
            remaining_credits: result.remainingCredits,
            photo_url: user.profilePhoto,
            type: 'direct_access',
        },
    });
}

function formatTime(date: Date) {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
