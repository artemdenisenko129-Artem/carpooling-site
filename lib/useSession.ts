"use client"
import { useEffect, useState } from "react"
import type { SessionUser } from "./session"

export function useSession() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setUser(data ?? null))
      .catch(() => setUser(null))
  }, [])

  return {
    user,
    loading: user === undefined,
    isLoggedIn: !!user,
  }
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" })
  window.location.href = "/"
}
