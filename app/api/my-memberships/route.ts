import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getDaysRemaining } from '@/lib/utils';

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

        // Obtener todas las membresías del usuario
        const memberships = await prisma.membership.findMany({
            where: {
                userId: authUser.userId,
            },
            include: {
                discipline: true,
                plan: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Formatear respuesta según la API documentada
        const formattedMemberships = memberships.map((m) => ({
            id: m.id,
            discipline: m.discipline.name,
            discipline_id: m.disciplineId,
            total_credits: m.totalCredits,
            remaining_credits: m.remainingCredits,
            is_unlimited: m.isUnlimited,
            start_date: m.startDate.toISOString().split('T')[0],
            expiration_date: m.expirationDate.toISOString().split('T')[0],
            days_remaining: getDaysRemaining(m.expirationDate),
            status: m.status,
        }));

        return NextResponse.json({
            memberships: formattedMemberships,
        });

    } catch (error) {
        console.error('Get memberships error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
