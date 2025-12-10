import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/plans - Obtener todos los planes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const disciplineId = searchParams.get('disciplineId');
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const whereClause: any = {};

        if (disciplineId) {
            whereClause.disciplineId = parseInt(disciplineId);
        }

        if (activeOnly) {
            whereClause.isActive = true;
        }

        const plans = await prisma.plan.findMany({
            where: whereClause,
            include: {
                discipline: {
                    select: {
                        id: true,
                        name: true,
                        requiresReservation: true,
                    },
                },
                _count: {
                    select: {
                        memberships: {
                            where: { status: 'ACTIVE' },
                        },
                    },
                },
            },
            orderBy: [
                { discipline: { name: 'asc' } },
                { price: 'asc' },
            ],
        });

        const formattedPlans = plans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            credits: plan.credits,
            isUnlimited: plan.isUnlimited,
            durationDays: plan.durationDays,
            disciplineId: plan.disciplineId,
            disciplineName: plan.discipline.name,
            requiresReservation: plan.discipline.requiresReservation,
            isActive: plan.isActive,
            activeMemberships: plan._count.memberships,
            createdAt: plan.createdAt.toISOString(),
        }));

        return NextResponse.json({ plans: formattedPlans });
    } catch (error) {
        console.error('Get plans error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// POST /api/plans - Crear un nuevo plan
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, price, credits, isUnlimited, durationDays, disciplineId } = body;

        // Validaciones
        if (!name || !disciplineId || price === undefined) {
            return NextResponse.json(
                { message: 'Nombre, disciplina y precio son requeridos' },
                { status: 400 }
            );
        }

        // Verificar que la disciplina existe
        const discipline = await prisma.discipline.findUnique({
            where: { id: disciplineId },
        });

        if (!discipline) {
            return NextResponse.json(
                { message: 'Disciplina no encontrada' },
                { status: 404 }
            );
        }

        const plan = await prisma.plan.create({
            data: {
                name,
                description: description || null,
                price: parseFloat(price),
                credits: isUnlimited ? 0 : parseInt(credits) || 0,
                isUnlimited: isUnlimited || false,
                durationDays: parseInt(durationDays) || 30,
                disciplineId,
            },
            include: {
                discipline: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            message: 'Plan creado exitosamente',
            plan: {
                id: plan.id,
                name: plan.name,
                disciplineName: plan.discipline.name,
            },
        });
    } catch (error) {
        console.error('Create plan error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
