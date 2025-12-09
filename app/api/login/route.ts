import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar datos con Zod
        const validatedData = loginSchema.parse(body);

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
            include: {
                memberships: {
                    where: {
                        status: 'ACTIVE',
                        expirationDate: {
                            gte: new Date(),
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Verificar si el usuario está activo
        if (!user.isActive) {
            return NextResponse.json(
                { message: 'Usuario inactivo. Contacta al administrador.' },
                { status: 403 }
            );
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(
            validatedData.password,
            user.password
        );

        if (!isPasswordValid) {
            return NextResponse.json(
                { message: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Para clientes, verificar que tengan al menos una membresía activa
        if (user.rol === 'CLIENTE' && user.memberships.length === 0) {
            return NextResponse.json(
                { message: 'Tu membresía ha vencido. Acercate al gimnasio para renovar.' },
                { status: 403 }
            );
        }

        // Generar token JWT
        const token = generateToken({
            id: user.id,
            email: user.email,
            rol: user.rol,
        });

        // Preparar respuesta (sin password)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            message: 'Login exitoso',
            access_token: token,
            token_type: 'Bearer',
            user: {
                id: userWithoutPassword.id,
                name: userWithoutPassword.name,
                email: userWithoutPassword.email,
                rol: userWithoutPassword.rol,
                phone: userWithoutPassword.phone,
                profilePhoto: userWithoutPassword.profilePhoto,
            },
        });

    } catch (error: any) {
        // Error de validación de Zod
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

        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
