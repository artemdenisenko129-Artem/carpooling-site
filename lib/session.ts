import { cookies } from "next/headers"
import { verifyToken } from "./jwt"
import type { JWTPayload } from "./jwt"

export type SessionUser = JWTPayload

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  return verifyToken(token)
}
