import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkInSchema, qrDataSchema } from '@/lib/validations';
import { validateQRData } from '@/lib/qr';
import { isWithinWindow } from '@/lib/utils';

const RESERVATION_WINDOW_MINUTES = parseInt(process.env.RESERVATION_WINDOW_MINUTES || '30');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = checkInSchema.parse(body);

        let userId: number;

        // Determinar userId (desde QR o directo)
        if (validatedData.qr_data) {
            try {
                const qrData = JSON.parse(validatedData.qr_data);
                const qrValidation = qrDataSchema.parse(qrData);
                const validation = validateQRData(qrValidation);

                if (!validation.valid) {
                    return NextResponse.json(
                        {
                            status: 'error',
                            message: validation.reason || 'QR inválido',
                        },
                        { status: 400 }
                    );
                }

                userId = validation.userId!;
            } catch (error) {
                return NextResponse.json(
                    {
                        status: 'error',
                        message: 'Formato de QR inválido',
                    },
                    { status: 400 }
                );
            }
        } else if (validatedData.user_id) {
            userId = validatedData.user_id;
        } else {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Debes proporcionar user_id o qr_data',
                },
                { status: 400 }
            );
        }

        // Obtener usuario y disciplina
        const [user, discipline] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    memberships: {
                        where: {
                            disciplineId: validatedData.discipline_id,
                            status: 'ACTIVE',
                            expirationDate: { gte: new Date() },
                        },
                    },
                },
            }),
            prisma.discipline.findUnique({
                where: { id: validatedData.discipline_id },
            }),
        ]);

        if (!user) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Usuario no encontrado',
                },
                { status: 404 }
            );
        }

        if (!discipline) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Disciplina no encontrada',
                },
                { status: 404 }
            );
        }

        // Verificar membresía activa
        const membership = user.memberships[0];

        if (!membership) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: `${user.name} no tiene membresía activa para ${discipline.name}`,
                },
                { status: 402 }
            );
        }

        // 1️⃣ Buscar reserva activa dentro de la ventana de tiempo (±30 min)
        const now = new Date();
        const windowStart = new Date(now.getTime() - RESERVATION_WINDOW_MINUTES * 60 * 1000);
        const windowEnd = new Date(now.getTime() + RESERVATION_WINDOW_MINUTES * 60 * 1000);

        const activeReservation = await prisma.reservation.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                attended: false,
                class: {
                    disciplineId: validatedData.discipline_id,
                    startTime: {
                        gte: windowStart,
                        lte: windowEnd,
                    },
                },
            },
            include: {
                class: true,
            },
        });

        // 2️⃣ Si tiene reserva → Solo marcar asistencia (NO descontar crédito)
        if (activeReservation) {
            await prisma.$transaction(async (tx) => {
                // Marcar asistencia en reserva
                await tx.reservation.update({
                    where: { id: activeReservation.id },
                    data: { attended: true },
                });

                // Registrar asistencia
                await tx.attendance.create({
                    data: {
                        userId,
                        disciplineId: validatedData.discipline_id,
                        membershipId: membership.id,
                        type: 'reservation',
                        checkInTime: new Date(),
                    },
                });

                // Log de acceso
                await tx.accessLog.create({
                    data: {
                        userId,
                        accessType: validatedData.qr_data ? 'qr_dynamic' : 'manual',
                        granted: true,
                        reason: `Asistencia registrada: ${activeReservation.class.name}`,
                        disciplineName: discipline.name,
                    },
                });
            });

            return NextResponse.json({
                status: 'success',
                message: `✅ Asistencia registrada para ${activeReservation.class.name}`,
                data: {
                    discipline: discipline.name,
                    remaining_credits: membership.remainingCredits,
                    photo_url: user.profilePhoto,
                    type: 'reservation',
                },
            });
        }

        // 3️⃣ NO tiene reserva → Verificar si la disciplina requiere reserva
        if (discipline.requiresReservation) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: `${discipline.name} requiere reservar turno previamente.`,
                },
                { status: 400 }
            );
        }

        // 4️⃣ Acceso directo (ej: Musculación) → Descontar crédito AHORA
        if (!membership.isUnlimited && membership.remainingCredits <= 0) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Sin créditos disponibles',
                },
                { status: 402 }
            );
        }

        // Procesar check-in directo
        const result = await prisma.$transaction(async (tx) => {
            // Descontar crédito
            let updatedMembership = membership;
            if (!membership.isUnlimited) {
                updatedMembership = await tx.membership.update({
                    where: { id: membership.id },
                    data: {
                        remainingCredits: {
                            decrement: 1,
                        },
                    },
                });
            }

            // Registrar asistencia
            await tx.attendance.create({
                data: {
                    userId,
                    disciplineId: validatedData.discipline_id,
                    membershipId: membership.id,
                    type: 'direct_access',
                    checkInTime: new Date(),
                },
            });

            // Log de acceso
            await tx.accessLog.create({
                data: {
                    userId,
                    accessType: validatedData.qr_data ? 'qr_dynamic' : 'manual',
                    granted: true,
                    reason: `Acceso Directo: ${discipline.name}`,
                    disciplineName: discipline.name,
                },
            });

            return updatedMembership;
        });

        return NextResponse.json({
            status: 'success',
            message: `¡Bienvenido ${user.name}! Acceso permitido a ${discipline.name}`,
            data: {
                discipline: discipline.name,
                remaining_credits: result.remainingCredits,
                photo_url: user.profilePhoto,
                type: 'direct_access',
            },
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Datos inválidos',
                    errors: error.errors,
                },
                { status: 400 }
            );
        }

        console.error('Check-in error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Error interno del servidor',
            },
            { status: 500 }
        );
    }
}
