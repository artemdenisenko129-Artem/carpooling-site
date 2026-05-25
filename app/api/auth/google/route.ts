import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const clientId = process.env.GOOGLE_CLIENT_ID
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL || "https://carpooling-site.vercel.app"

  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  baseUrl + "/api/auth/google/callback",
    response_type: "code",
    scope:         "openid email profile",
    state:         callbackUrl,
    prompt:        "select_account",
  })

  return NextResponse.redirect(
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
  )
}
