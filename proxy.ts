import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy handler for Next.js 16
 * Works like the old middleware pattern
 */
export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Example: Proxy to external API
    // if (pathname.startsWith('/api/external')) {
    //   const url = new URL(pathname.replace('/api/external', ''), 'https://api.example.com');
    //   return NextResponse.rewrite(url);
    // }

    // Example: Proxy for Mercado Pago
    // if (pathname.startsWith('/api/mercadopago')) {
    //   const url = new URL(pathname.replace('/api/mercadopago', ''), 'https://api.mercadopago.com');
    //   return NextResponse.rewrite(url);
    // }

    return NextResponse.next();
}

// Matcher config - similar to middleware
export const config = {
    matcher: [
        '/api/:path*',
        // Add more paths as needed
    ],
};
