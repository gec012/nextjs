import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { generateQRData } from '@/lib/qr';

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

        // Generar QR dinámico
        const qrData = generateQRData(authUser.userId);

        // Convertir a string para el QR
        const qrCode = JSON.stringify(qrData);

        return NextResponse.json({
            code: qrCode,
            expiresAt: new Date(qrData.exp).toISOString(),
            userId: authUser.userId,
        });

    } catch (error) {
        console.error('Generate QR error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
