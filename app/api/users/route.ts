import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Obtener todos los usuarios
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

        // Solo admin y staff pueden ver usuarios
        if (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.rol = role;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    rol: true,
                    profilePhoto: true,
                    createdAt: true,
                    _count: {
                        select: {
                            memberships: {
                                where: { status: 'ACTIVE' }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            rol: user.rol,
            profilePhoto: user.profilePhoto,
            createdAt: user.createdAt.toISOString(),
            activeMemberships: user._count.memberships,
        }));

        return NextResponse.json({
            users: formattedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
    try {
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

        const body = await request.json();
        const { name, email, password, phone, rol } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Nombre, email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Verificar email único
        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json(
                { message: 'Ya existe un usuario con ese email' },
                { status: 400 }
            );
        }

        // Hash password (simple para demo - en producción usar bcrypt)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone || null,
                rol: rol || 'CLIENT',
            },
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
            message: 'Usuario creado exitosamente',
            user,
        });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
