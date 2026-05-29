import { NextResponse } from "next/server"
import crypto from "crypto"
import { signToken } from "../../../../lib/jwt"

function verifyTelegramHash(data: Record<string, string>): boolean {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) return false
  const { hash, ...rest } = data
  if (!hash) return false
  const authDate = parseInt(rest.auth_date || "0", 10)
  if (Date.now() / 1000 - authDate > 86400) return false
  const checkString = Object.keys(rest).sort().map(k => k + "=" + rest[k]).join("\n")
  const secretKey = crypto.createHash("sha256").update(botToken).digest()
  const expectedHash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex")
  return expectedHash === hash
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  const next = params.next || "/"
  const { next: _next, ...telegramData } = params

  if (!verifyTelegramHash(telegramData)) {
    return NextResponse.redirect(new URL("/login?error=tg_hash", url.origin))
  }

  const name = [telegramData.first_name, telegramData.last_name].filter(Boolean).join(" ")
  const token = signToken({
    id: String(telegramData.id),
    name,
    telegramUsername: telegramData.username || null,
    image: telegramData.photo_url || null,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })

  const dest = new URL(next, url.origin).toString()
  const response = NextResponse.redirect(dest)
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })
  return response
}
