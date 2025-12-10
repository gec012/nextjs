import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { changePasswordSchema } from '@/lib/validations';

export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validar con Zod
        const validatedData = changePasswordSchema.parse(body);

        // Obtener usuario
        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Verificar contraseña actual
        const isCurrentPasswordValid = await bcrypt.compare(
            validatedData.current_password,
            user.password
        );

        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { message: 'La contraseña actual es incorrecta' },
                { status: 400 }
            );
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(validatedData.new_password, 10);

        // Actualizar contraseña
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            message: 'Contraseña actualizada exitosamente',
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                {
                    message: 'Datos inválidos',
                    errors: error.errors.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                },
                { status: 400 }
            );
        }

        console.error('Change password error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
