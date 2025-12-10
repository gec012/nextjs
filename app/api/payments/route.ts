import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/payments - Obtener todos los pagos
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
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '50');

        const whereClause: any = {};

        if (status) {
            whereClause.status = status;
        }

        if (userId) {
            whereClause.userId = parseInt(userId);
        }

        const payments = await prisma.payment.findMany({
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
                        discipline: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });

        const formattedPayments = payments.map((p) => ({
            id: p.id,
            userId: p.userId,
            userName: p.user.name,
            userEmail: p.user.email,
            planId: p.planId,
            planName: p.plan.name,
            disciplineName: p.plan.discipline.name,
            amount: p.amount,
            method: p.method,
            status: p.status,
            notes: p.notes,
            createdAt: p.createdAt.toISOString(),
            approvedAt: p.approvedAt?.toISOString() || null,
        }));

        // Stats
        const stats = await prisma.payment.groupBy({
            by: ['status'],
            _sum: {
                amount: true,
            },
            _count: true,
        });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayPayments = await prisma.payment.aggregate({
            where: {
                status: 'APPROVED',
                approvedAt: {
                    gte: todayStart,
                },
            },
            _sum: {
                amount: true,
            },
            _count: true,
        });

        return NextResponse.json({
            payments: formattedPayments,
            stats: {
                byStatus: stats,
                today: {
                    count: todayPayments._count,
                    total: todayPayments._sum.amount || 0,
                },
            },
        });
    } catch (error) {
        console.error('Get payments error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// POST /api/payments - Registrar un nuevo pago
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
        const { userId, planId, amount, method, notes, autoApprove } = body;

        // Validaciones
        if (!userId || !planId || !amount || !method) {
            return NextResponse.json(
                { message: 'Usuario, plan, monto y método de pago son requeridos' },
                { status: 400 }
            );
        }

        // Validar método de pago
        const validMethods = ['CASH', 'TRANSFER', 'CREDIT', 'DEBIT', 'MERCADOPAGO'];
        if (!validMethods.includes(method)) {
            return NextResponse.json(
                { message: 'Método de pago inválido' },
                { status: 400 }
            );
        }

        // Verificar usuario
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Verificar plan
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

        // Crear el pago
        const payment = await prisma.payment.create({
            data: {
                userId,
                planId,
                amount: parseFloat(amount),
                method,
                status: autoApprove ? 'APPROVED' : 'PENDING',
                notes: notes || null,
                approvedBy: autoApprove ? authUser.userId : null,
                approvedAt: autoApprove ? new Date() : null,
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
                        discipline: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            message: autoApprove
                ? `Pago de $${amount} registrado y aprobado para ${user.name}`
                : `Pago de $${amount} registrado como pendiente`,
            payment: {
                id: payment.id,
                userName: payment.user.name,
                planName: payment.plan.name,
                disciplineName: payment.plan.discipline.name,
                amount: payment.amount,
                method: payment.method,
                status: payment.status,
            },
        });
    } catch (error) {
        console.error('Create payment error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
