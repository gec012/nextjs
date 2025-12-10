import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Obtener un usuario específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        if (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { message: 'ID de usuario inválido' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                rol: true,
                profilePhoto: true,
                createdAt: true,
                memberships: {
                    where: { status: 'ACTIVE' },
                    include: {
                        discipline: true,
                        plan: true,
                    }
                },
                _count: {
                    select: {
                        reservations: true,
                        attendances: true,
                    }
                }
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar usuario
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        if (authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { message: 'ID de usuario inválido' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, email, phone, rol, password } = body;

        // Verificar que existe
        const existing = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existing) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Verificar email único si cambió
        if (email && email !== existing.email) {
            const duplicate = await prisma.user.findUnique({
                where: { email },
            });

            if (duplicate) {
                return NextResponse.json(
                    { message: 'Ya existe un usuario con ese email' },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (rol) updateData.rol = rol;

        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                rol: true,
                createdAt: true,
            }
        });

        return NextResponse.json({
            message: 'Usuario actualizado exitosamente',
            user: updated,
        });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar/Desactivar usuario
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        if (authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { message: 'ID de usuario inválido' },
                { status: 400 }
            );
        }

        // No permitir auto-eliminación
        if (userId === authUser.userId) {
            return NextResponse.json(
                { message: 'No puedes eliminar tu propia cuenta' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Soft delete - cambiar rol a un estado "desactivado" o eliminar
        // Por ahora hacemos hard delete 
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({
            message: 'Usuario eliminado exitosamente',
            deletedId: userId,
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
