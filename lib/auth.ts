import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Nombre de la cookie de autenticación
export const AUTH_COOKIE_NAME = 'gym-auth-token';

// Configuración de la cookie
export const COOKIE_OPTIONS = {
    httpOnly: true,      // JavaScript NO puede acceder
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
    sameSite: 'lax' as const,     // Protección CSRF
    maxAge: 60 * 60 * 24 * 7,     // 7 días en segundos
    path: '/',
};

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
        expiresIn: '7d', // Token válido por 7 días (más seguro)
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
 * Middleware helper para verificar autenticación desde header O cookie
 */
export async function authenticateRequest(
    authHeader: string | null,
    request?: NextRequest
): Promise<JWTPayload | null> {
    // Primero intentar con header Authorization
    const headerToken = extractTokenFromHeader(authHeader);
    if (headerToken) {
        return verifyToken(headerToken);
    }

    // Si no hay header, intentar con cookie
    if (request) {
        const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
        if (cookieToken) {
            return verifyToken(cookieToken);
        }
    }

    return null;
}

/**
 * Autenticar desde cookies (para uso en Server Components)
 */
export async function authenticateFromCookies(): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

        if (!token) {
            return null;
        }

        return verifyToken(token);
    } catch (error) {
        console.error('Error authenticating from cookies:', error);
        return null;
    }
}
