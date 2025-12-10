import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/my-payments - Obtener los pagos del usuario autenticado
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        const payments = await prisma.payment.findMany({
            where: {
                userId: authUser.userId,
            },
            include: {
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
        });

        const formattedPayments = payments.map((p) => ({
            id: p.id,
            planName: p.plan.name,
            disciplineName: p.plan.discipline.name,
            amount: p.amount,
            method: p.method,
            status: p.status,
            notes: p.notes,
            createdAt: p.createdAt.toISOString(),
        }));

        return NextResponse.json({ payments: formattedPayments });
    } catch (error) {
        console.error('Get my payments error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
