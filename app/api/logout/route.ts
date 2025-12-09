import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const user = await authenticateRequest(authHeader);

        if (!user) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        // En un sistema JWT stateless, el logout se maneja en el cliente
        // Aquí podríamos invalidar el token en una blacklist si fuera necesario
        // Por ahora solo confirmamos el logout

        return NextResponse.json({
            message: 'Logout exitoso',
        });

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
