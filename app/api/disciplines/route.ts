import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Obtener todas las disciplinas
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

        const disciplines = await prisma.discipline.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Formatear respuesta
        const formattedDisciplines = disciplines.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            requiresReservation: d.requiresReservation,
            color: getColorForDiscipline(d.name), // Asignar color basado en nombre
            isActive: d.isActive,
        }));

        return NextResponse.json({
            disciplines: formattedDisciplines,
        });

    } catch (error) {
        console.error('Get disciplines error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// POST - Crear nueva disciplina (solo admin)
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
        const { name, description, requiresReservation } = body;

        if (!name) {
            return NextResponse.json(
                { message: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        // Verificar si ya existe
        const existing = await prisma.discipline.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { message: 'Ya existe una disciplina con ese nombre' },
                { status: 400 }
            );
        }

        const discipline = await prisma.discipline.create({
            data: {
                name,
                description: description || '',
                requiresReservation: requiresReservation ?? false,
            },
        });

        return NextResponse.json({
            message: 'Disciplina creada exitosamente',
            discipline: {
                id: discipline.id,
                name: discipline.name,
                description: discipline.description,
                requiresReservation: discipline.requiresReservation,
            },
        });

    } catch (error) {
        console.error('Create discipline error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// Función helper para asignar colores
function getColorForDiscipline(name: string): string {
    const colorMap: Record<string, string> = {
        'Musculación': 'from-orange-500 to-red-500',
        'Pesas': 'from-gray-500 to-zinc-500',
        'CrossFit': 'from-green-500 to-emerald-500',
        'Yoga': 'from-purple-500 to-pink-500',
        'Spinning': 'from-blue-500 to-cyan-500',
        'Pilates': 'from-pink-500 to-rose-500',
        'Natación': 'from-cyan-500 to-blue-500',
        'Boxeo': 'from-red-500 to-orange-500',
        'Funcional': 'from-yellow-500 to-amber-500',
    };

    return colorMap[name] || 'from-blue-500 to-purple-500';
}
