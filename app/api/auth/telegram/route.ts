import { NextResponse } from "next/server"
import crypto from "crypto"
import { signToken } from "../../../../lib/jwt"
import { cookies } from "next/headers"

function verifyTelegramHash(data: Record<string, string>): boolean {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) return false
  const { hash, ...rest } = data
  if (!hash) return false
  const authDate = parseInt(rest.auth_date || "0", 10)
  if (Date.now() / 1000 - authDate > 86400) return false
  const checkString = Object.keys(rest)
    .sort()
    .map((k) => k + "=" + rest[k])
    .join("\n")
  const secretKey = crypto.createHash("sha256").update(botToken).digest()
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex")
  return expectedHash === hash
}

export async function POST(request: Request) {
  const data = (await request.json()) as Record<string, string>

  if (!verifyTelegramHash(data)) {
    return NextResponse.json({ error: "Invalid hash" }, { status: 401 })
  }

  const name = [data.first_name, data.last_name].filter(Boolean).join(" ")

  const token = signToken({
    id: String(data.id),
    name,
    telegramUsername: data.username || null,
    image: data.photo_url || null,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  })

  return NextResponse.json({ ok: true })
}
