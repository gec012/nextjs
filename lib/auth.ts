import jwt from 'jsonwebtoken';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface JWTPayload {
    userId: number;
    email: string;
    rol: string;
}

/**
 * Genera un token JWT para un usuario
 */
export function generateToken(user: { id: number; email: string; rol: string }): string {
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        rol: user.rol,
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '30d', // Token válido por 30 días
    });
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

/**
 * Extrae el token del header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    // Formato: "Bearer {token}"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}

/**
 * Middleware helper para verificar autenticación
 */
export async function authenticateRequest(
    authHeader: string | null
): Promise<JWTPayload | null> {
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return null;
    }

    return verifyToken(token);
}
