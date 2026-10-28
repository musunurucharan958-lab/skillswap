import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/skills',
  '/learning',
  '/teaching',
  '/sessions',
  '/chat',
  '/certificates',
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getDemoUser(request: NextRequest) {
  const value = request.cookies.get('demo_user')?.value;

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const demoUser = getDemoUser(request);
  if (!process.env.NEXT_PUBLIC_CLIENT_ID || !process.env.NEXT_PUBLIC_BASE_URL) {
    if (demoUser) {
      return NextResponse.next();
    }

    const loginUrl = new URL('/api/auth/demo-login', request.nextUrl.origin);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const statusUrl = new URL('/api/auth/status', request.nextUrl.origin);
    const statusResponse = await fetch(statusUrl, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (statusResponse.ok) {
      const data = await statusResponse.json();
      if (data?.authenticated) {
        return NextResponse.next();
      }
    }

    const loginUrl = new URL('/api/auth/demo-login', request.nextUrl.origin);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  } catch {
    const loginUrl = new URL('/api/auth/demo-login', request.nextUrl.origin);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|robots.txt|sitemap.xml|.*\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|otf|css|txt|xml)$).*)',
  ]
};