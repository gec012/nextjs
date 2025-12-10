import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const user = await authenticateRequest(authHeader, request);

        if (!user) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        // Crear respuesta de logout exitoso
        const response = NextResponse.json({
            message: 'Logout exitoso',
        });

        // Eliminar la cookie HttpOnly seteando maxAge a 0
        response.cookies.set(AUTH_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Elimina la cookie inmediatamente
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
