import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/new")) {
    // Перевіряємо наявність сесійного cookie від next-auth
    const sessionToken =
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("authjs.session-token")?.value

    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/new"],
}
