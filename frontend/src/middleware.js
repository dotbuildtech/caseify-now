import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set([
    '/login', '/register', '/shop', '/product', '/products',
    '/contact', '/track', '/customize', '/', '/_not-found'
]);

const AUTH_PATHS = new Set(['/login', '/register']);

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('accessToken')?.value;

    const isPublic = [...PUBLIC_PATHS].some((p) => pathname === p || pathname.startsWith(p + '/'));
    const isAuthPage = [...AUTH_PATHS].some((p) => pathname === p);

    if (isAuthPage && accessToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (!isPublic && !accessToken && !pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)']
};
