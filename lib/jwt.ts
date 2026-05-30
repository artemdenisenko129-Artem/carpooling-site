import crypto from "crypto"

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-please-change"

export interface JWTPayload {
  id: string
  name: string
  email?: string | null
  telegramUsername: string | null
  image: string | null
  exp: number
}

function b64url(buf: Buffer): string {
  return buf.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export function signToken(payload: JWTPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = b64url(
    crypto.createHmac("sha256", SECRET).update(data).digest()
  )
  return data + "." + sig
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const dot = token.lastIndexOf(".")
    if (dot === -1) return null
    const data = token.slice(0, dot)
    const sig  = token.slice(dot + 1)
    const expected = b64url(
      crypto.createHmac("sha256", SECRET).update(data).digest()
    )
    if (sig !== expected) return null
    const payload: JWTPayload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    )
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
