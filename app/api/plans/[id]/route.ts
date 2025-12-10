import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET /api/plans/[id] - Obtener un plan específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const planId = parseInt(id);

        const plan = await prisma.plan.findUnique({
            where: { id: planId },
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
                        memberships: true,
                    },
                },
            },
        });

        if (!plan) {
            return NextResponse.json(
                { message: 'Plan no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
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
            totalMemberships: plan._count.memberships,
        });
    } catch (error) {
        console.error('Get plan error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// PUT /api/plans/[id] - Actualizar un plan
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const planId = parseInt(id);
        const body = await request.json();
        const { name, description, price, credits, isUnlimited, durationDays, isActive } = body;

        const existingPlan = await prisma.plan.findUnique({
            where: { id: planId },
        });

        if (!existingPlan) {
            return NextResponse.json(
                { message: 'Plan no encontrado' },
                { status: 404 }
            );
        }

        const plan = await prisma.plan.update({
            where: { id: planId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description: description || null }),
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(credits !== undefined && { credits: isUnlimited ? 0 : parseInt(credits) }),
                ...(isUnlimited !== undefined && { isUnlimited }),
                ...(durationDays !== undefined && { durationDays: parseInt(durationDays) }),
                ...(isActive !== undefined && { isActive }),
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
            message: 'Plan actualizado exitosamente',
            plan: {
                id: plan.id,
                name: plan.name,
                disciplineName: plan.discipline.name,
            },
        });
    } catch (error) {
        console.error('Update plan error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// DELETE /api/plans/[id] - Eliminar un plan
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const planId = parseInt(id);

        // Verificar si tiene membresías activas
        const activeMemberships = await prisma.membership.count({
            where: {
                planId,
                status: 'ACTIVE',
            },
        });

        if (activeMemberships > 0) {
            return NextResponse.json(
                {
                    message: `No se puede eliminar: hay ${activeMemberships} membresía(s) activa(s) con este plan`,
                },
                { status: 400 }
            );
        }

        await prisma.plan.delete({
            where: { id: planId },
        });

        return NextResponse.json({
            message: 'Plan eliminado exitosamente',
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { message: 'Plan no encontrado' },
                { status: 404 }
            );
        }
        console.error('Delete plan error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
