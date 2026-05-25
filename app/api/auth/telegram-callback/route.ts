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

function popupHtml(dest: string): string {
  const safe = dest.replace(/"/g, "&quot;")
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
try {
  if (window.opener && !window.opener.closed) {
    window.opener.location.href = "${safe}";
    window.close();
  } else {
    window.location.href = "${safe}";
  }
} catch(e) {
  window.location.href = "${safe}";
}
<\/script></body></html>`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())

  const next = params.next || "/"
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { next: _next, ...telegramData } = params

  if (!verifyTelegramHash(telegramData)) {
    const errHtml = popupHtml(url.origin + "/login?error=tg_hash")
    return new Response(errHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  }

  const name = [telegramData.first_name, telegramData.last_name]
    .filter(Boolean)
    .join(" ")

  const token = signToken({
    id: String(telegramData.id),
    name,
    telegramUsername: telegramData.username || null,
    image: telegramData.photo_url || null,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })

  const dest = new URL(next, url.origin).toString()
  const html = popupHtml(dest)

  const cookieValue = [
    `session=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${30 * 24 * 60 * 60}`,
  ].join("; ")

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": cookieValue,
    },
  })
}
