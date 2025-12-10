import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { addDays } from 'date-fns';

// GET /api/memberships - Obtener todas las membresías (admin)
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF')) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        const whereClause: any = {};

        if (userId) {
            whereClause.userId = parseInt(userId);
        }

        if (status) {
            whereClause.status = status;
        }

        const memberships = await prisma.membership.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                    },
                },
                discipline: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const formattedMemberships = memberships.map((m) => ({
            id: m.id,
            userId: m.userId,
            userName: m.user.name,
            userEmail: m.user.email,
            planName: m.plan.name,
            disciplineName: m.discipline.name,
            startDate: m.startDate.toISOString(),
            expirationDate: m.expirationDate.toISOString(),
            totalCredits: m.totalCredits,
            remainingCredits: m.remainingCredits,
            isUnlimited: m.isUnlimited,
            status: m.status,
        }));

        return NextResponse.json({ memberships: formattedMemberships });
    } catch (error) {
        console.error('Get memberships error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// POST /api/memberships - Asignar un plan a un usuario (con registro de pago)
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF')) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, planId, startDate, paymentMethod, paymentNotes, customAmount } = body;

        // Validaciones
        if (!userId || !planId) {
            return NextResponse.json(
                { message: 'Usuario y plan son requeridos' },
                { status: 400 }
            );
        }

        // Validar método de pago si se proporciona
        const validMethods = ['CASH', 'TRANSFER', 'CREDIT', 'DEBIT', 'MERCADOPAGO'];
        if (paymentMethod && !validMethods.includes(paymentMethod)) {
            return NextResponse.json(
                { message: 'Método de pago inválido' },
                { status: 400 }
            );
        }

        // Verificar que el usuario existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Verificar que el plan existe y está activo
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
            include: {
                discipline: true,
            },
        });

        if (!plan) {
            return NextResponse.json(
                { message: 'Plan no encontrado' },
                { status: 404 }
            );
        }

        if (!plan.isActive) {
            return NextResponse.json(
                { message: 'El plan no está activo' },
                { status: 400 }
            );
        }

        // Verificar si ya tiene una membresía activa para esta disciplina
        const existingMembership = await prisma.membership.findFirst({
            where: {
                userId,
                disciplineId: plan.disciplineId,
                status: 'ACTIVE',
                expirationDate: { gte: new Date() },
            },
        });

        if (existingMembership) {
            return NextResponse.json(
                {
                    message: `El usuario ya tiene una membresía activa para ${plan.discipline.name}`,
                },
                { status: 400 }
            );
        }

        // Calcular fechas
        const membershipStartDate = startDate ? new Date(startDate) : new Date();
        const expirationDate = addDays(membershipStartDate, plan.durationDays);

        // Monto del pago (puede ser personalizado o el precio del plan)
        const paymentAmount = customAmount ? parseFloat(customAmount) : plan.price;

        // Crear membresía y pago en una transacción
        const result = await prisma.$transaction(async (tx) => {
            // Crear la membresía
            const membership = await tx.membership.create({
                data: {
                    userId,
                    planId,
                    disciplineId: plan.disciplineId,
                    totalCredits: plan.credits,
                    remainingCredits: plan.credits,
                    isUnlimited: plan.isUnlimited,
                    startDate: membershipStartDate,
                    expirationDate,
                    status: 'ACTIVE',
                },
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                    plan: {
                        select: {
                            name: true,
                        },
                    },
                    discipline: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            // Crear el registro de pago si se proporcionó método de pago
            let payment = null;
            if (paymentMethod) {
                payment = await tx.payment.create({
                    data: {
                        userId,
                        planId,
                        amount: paymentAmount,
                        method: paymentMethod,
                        status: 'APPROVED',
                        approvedBy: authUser.userId,
                        approvedAt: new Date(),
                        notes: paymentNotes || null,
                    },
                });
            }

            return { membership, payment };
        });

        const paymentInfo = result.payment
            ? ` | Pago: $${paymentAmount.toLocaleString()} (${getPaymentMethodLabel(paymentMethod)})`
            : '';

        return NextResponse.json({
            message: `Membresía asignada a ${result.membership.user.name}${paymentInfo}`,
            membership: {
                id: result.membership.id,
                userName: result.membership.user.name,
                planName: result.membership.plan.name,
                disciplineName: result.membership.discipline.name,
                expirationDate: result.membership.expirationDate.toISOString(),
            },
            payment: result.payment ? {
                id: result.payment.id,
                amount: result.payment.amount,
                method: result.payment.method,
            } : null,
        });
    } catch (error) {
        console.error('Create membership error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
        CASH: 'Efectivo',
        TRANSFER: 'Transferencia',
        CREDIT: 'Tarjeta Crédito',
        DEBIT: 'Tarjeta Débito',
        MERCADOPAGO: 'MercadoPago',
    };
    return labels[method] || method;
}
