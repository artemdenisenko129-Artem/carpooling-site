import type { NextAuthConfig } from "next-auth"

// Цей файл завантажується в Edge Runtime (middleware).
// НЕ можна імпортувати mongodb, dns або інші Node.js модулі.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = nextUrl.pathname.startsWith("/new")
      if (isProtected && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl)
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return Response.redirect(loginUrl)
      }
      return true
    },
  },
  providers: [], // провайдери додаються у повному auth.ts
}
