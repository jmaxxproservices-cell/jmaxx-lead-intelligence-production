import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const username = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    console.error("Basic Auth environment variables are missing.");

    return new NextResponse("Server configuration error", {
      status: 500,
    });
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const encoded = authHeader.slice(6).trim();

    const decoded = atob(encoded);

    const separator = decoded.indexOf(":");

    if (separator === -1) {
      return unauthorized();
    }

    const user = decoded.substring(0, separator);
    const pwd = decoded.substring(separator + 1);

    if (user === username && pwd === password) {
      return NextResponse.next();
    }
  } catch (err) {
    console.error("Basic Auth parsing failed:", err);
  }

  return unauthorized();
}

function unauthorized() {
  return new NextResponse("Authentication Required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure JMAXX Dashboard"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml|woff|woff2|ttf)$).*)",
  ],
};
