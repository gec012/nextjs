import QRCode from 'qrcode';
import crypto from 'crypto';
import { QRData } from '@/types';

const QR_SECRET = process.env.QR_SECRET_KEY || 'qr-secret-default';
const QR_EXPIRATION_MS = parseInt(process.env.QR_EXPIRATION_MINUTES || '30') * 60 * 1000;

/**
 * Genera datos para QR dinámico con expiración
 */
export function generateQRData(userId: number): QRData {
    const now = Date.now();
    const expiration = now + QR_EXPIRATION_MS;

    // Generar hash de seguridad
    const dataToHash = `${userId}:${now}:${expiration}:${QR_SECRET}`;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex').substring(0, 16);

    return {
        id: userId,
        t: now,
        exp: expiration,
        h: hash,
    };
}

/**
 * Valida los datos de un QR dinámico
 */
export function validateQRData(qrData: QRData): { valid: boolean; reason?: string; userId?: number } {
    const now = Date.now();

    // Verificar que no esté vencido
    if (now > qrData.exp) {
        return {
            valid: false,
            reason: 'QR vencido. Por favor genera uno nuevo.',
        };
    }

    // Verificar el hash
    const dataToHash = `${qrData.id}:${qrData.t}:${qrData.exp}:${QR_SECRET}`;
    const expectedHash = crypto.createHash('sha256').update(dataToHash).digest('hex').substring(0, 16);

    if (qrData.h !== expectedHash) {
        return {
            valid: false,
            reason: 'QR inválido o manipulado.',
        };
    }

    return {
        valid: true,
        userId: qrData.id,
    };
}

/**
 * Genera la imagen del QR como Data URL
 */
export async function generateQRImage(data: QRData): Promise<string> {
    try {
        const qrString = JSON.stringify(data);
        const qrDataUrl = await QRCode.toDataURL(qrString, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR:', error);
        throw new Error('No se pudo generar el código QR');
    }
}

/**
 * Genera un QR estático para puntos de acceso
 */
export async function generateStaticQR(accessPointId: string): Promise<string> {
    try {
        const qrString = `GYM_ACCESS_POINT_${accessPointId}`;
        const qrDataUrl = await QRCode.toDataURL(qrString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 400,
            margin: 3,
        });

        return qrDataUrl;
    } catch (error) {
        console.error('Error generating static QR:', error);
        throw new Error('No se pudo generar el código QR estático');
    }
}

/**
 * Calcula el tiempo restante de un QR en minutos
 */
export function getQRTimeRemaining(qrData: QRData): number {
    const now = Date.now();
    const remainingMs = qrData.exp - now;
    return Math.max(0, Math.floor(remainingMs / 1000 / 60));
}
