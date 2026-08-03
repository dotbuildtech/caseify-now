import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set([
    '/login', '/register', '/shop', '/product', '/products',
    '/contact', '/track', '/customize', '/forgot-password',
    '/payment/success', '/payment/failure',
    '/', '/_not-found'
]);

const AUTH_PATHS = new Set(['/login', '/register']);

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('accessToken')?.value;

    const isPublic = [...PUBLIC_PATHS].some((p) => pathname === p || pathname.startsWith(p + '/'));
    const isAuthPage = [...AUTH_PATHS].some((p) => pathname === p);

    // PayU returns by submitting a POST form to surl/furl (older gateways) or
    // by redirecting with GET query params. Client page routes cannot process POST
    // requests. Convert any incoming POST form submission into a GET redirect (303)
    // with form fields in searchParams so useSearchParams() works cleanly.
    if (pathname === '/payment/success' || pathname === '/payment/failure') {
        if (request.method === 'POST') {
            const redirectUrl = request.nextUrl.clone();
            try {
                const form = await request.formData();
                for (const [k, v] of form.entries()) {
                    redirectUrl.searchParams.set(k, String(v));
                }
            } catch {
                // If form body parsing fails, proceed with redirecting as GET
            }
            return NextResponse.redirect(redirectUrl, 303);
        }
        return NextResponse.next();
    }

    if (!isPublic && !accessToken && !pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)']
};
