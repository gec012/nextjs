import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

        // Obtener usuario con su membresía principal activa
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
            include: {
                memberships: {
                    where: {
                        status: 'ACTIVE',
                    },
                    include: {
                        plan: true,
                        discipline: true,
                    },
                    take: 1,
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        const primaryMembership = user.memberships[0];

        return NextResponse.json({
            id: user.id,
            nombre: user.name,
            email: user.email,
            plan: primaryMembership?.plan.name || 'Sin plan',
            creditos: primaryMembership?.remainingCredits || 0,
            rol: user.rol,
            timestamp: Math.floor(Date.now() / 1000),
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
