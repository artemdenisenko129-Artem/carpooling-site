import { NextResponse } from "next/server"
import { signToken } from "../../../../../lib/jwt"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get("code")
  const state = searchParams.get("state") || "/"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://carpooling-site.vercel.app"

  if (!code) {
    return NextResponse.redirect(baseUrl + "/login?error=cancelled")
  }

  try {
    // Обмінюємо code на токен
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  baseUrl + "/api/auth/google/callback",
        grant_type:    "authorization_code",
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokens.access_token) {
      return NextResponse.redirect(baseUrl + "/login?error=token_failed")
    }

    // Отримуємо дані користувача від Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + tokens.access_token },
    })
    const googleUser = await userRes.json()

    if (!googleUser.sub) {
      return NextResponse.redirect(baseUrl + "/login?error=user_failed")
    }

    // Створюємо нашу JWT-сесію
    const token = signToken({
      id:              "google_" + googleUser.sub,
      name:            googleUser.name || googleUser.email || "Користувач",
      email:           googleUser.email || null,
      telegramUsername: null,
      image:           googleUser.picture || null,
      exp:             Date.now() + 30 * 24 * 60 * 60 * 1000,
    })

    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   30 * 24 * 60 * 60,
      path:     "/",
    })

    // Редіректимо назад на сторінку
    const redirectTo = state.startsWith("/") ? baseUrl + state : baseUrl
    return NextResponse.redirect(redirectTo)

  } catch (err) {
    console.error("Google OAuth error:", err)
    return NextResponse.redirect(baseUrl + "/login?error=server_error")
  }
}
