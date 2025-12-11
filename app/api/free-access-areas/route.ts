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

        if (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const disciplineId = searchParams.get('disciplineId');

        if (!disciplineId) {
            return NextResponse.json(
                { message: 'disciplineId es requerido' },
                { status: 400 }
            );
        }

        // Buscar configuración en SystemConfig
        const configKey = `free_access_area_${disciplineId}`;
        const config = await prisma.systemConfig.findUnique({
            where: { key: configKey }
        });

        if (!config) {
            return NextResponse.json({
                message: 'No hay configuración para esta disciplina',
                config: null
            });
        }

        return NextResponse.json({
            config: JSON.parse(config.value)
        });

    } catch (error) {
        console.error('Get free access area error:', error);
        return NextResponse.json(
            {
                message: 'Error interno del servidor',
            },
            { status: 500 }
        );
    }
}

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
        const { disciplineId, openTime, closeTime, capacity } = body;

        if (!disciplineId || !openTime || !closeTime) {
            return NextResponse.json(
                { message: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // Guardar configuración en SystemConfig
        const configKey = `free_access_area_${disciplineId}`;
        const configValue = JSON.stringify({
            disciplineId,
            openTime,
            closeTime,
            capacity: capacity || null,
        });

        await prisma.systemConfig.upsert({
            where: { key: configKey },
            update: { value: configValue },
            create: {
                key: configKey,
                value: configValue,
                description: `Configuración de área de acceso libre para disciplina ${disciplineId}`
            }
        });

        return NextResponse.json({
            message: 'Área de acceso libre configurada exitosamente',
        });

    } catch (error) {
        console.error('Create free access area error:', error);
        return NextResponse.json(
            {
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
