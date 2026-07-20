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

  const auth = authHeader.split(' ')[1];
  const [user, pwd] = atob(auth).split(':');

  // Tu usuario y contraseña oficiales
  if (user === 'jmaxxpro' && pwd === 'Suiza2026!') {
    return NextResponse.next();
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure JMAXX Dashboard"' },
  });
}

export const config = {
  matcher: '/(.*)',
};
