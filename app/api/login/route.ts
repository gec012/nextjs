import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken, AUTH_COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
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
        if (user.rol === 'CLIENT' && user.memberships.length === 0) {
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

        // Crear respuesta con cookie HttpOnly
        const response = NextResponse.json({
            message: 'Login exitoso',
            token_type: 'Bearer',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                rol: user.rol,
                // No incluir phone por seguridad - se puede obtener con GET /api/me
                profilePhoto: user.profilePhoto,
            },
        });

        // Setear cookie HttpOnly (JavaScript NO puede acceder a esto)
        response.cookies.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

        return response;

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
