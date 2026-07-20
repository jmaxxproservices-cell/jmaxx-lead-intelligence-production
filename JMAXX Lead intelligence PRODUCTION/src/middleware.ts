import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure JMAXX Dashboard"' },
    });
  }

  try {
    const auth = authHeader.split(' ');
    if (auth.length === 2 && auth[0].toLowerCase() === 'basic') {
      const decoded = atob(auth[1]).split(':');
      if (decoded.length === 2) {
        const user = decoded[0];
        const pwd = decoded[1];

        // Tus credenciales maestras oficiales
        if (user === 'jmaxxpro' && pwd === 'Suiza2026!') {
          return NextResponse.next();
        }
      }
    }
  } catch (e) {
    console.error('Auth error:', e);
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure JMAXX Dashboard"' },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
