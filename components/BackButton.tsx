"use client"
import { useRouter } from "next/navigation"

const FROM_MAP: Record<string, string> = {
  map: "/map",
}

export default function BackButton() {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== "undefined") {
      const from = new URLSearchParams(window.location.search).get("from")
      if (from && FROM_MAP[from]) {
        router.push(FROM_MAP[from])
        return
      }
    }
    router.back()
  }

  return (
    <button
      onClick={handleBack}
      className="text-sm font-semibold transition-colors"
      style={{ background: "none", border: "none", cursor: "pointer", color: "#5B8FD9", padding: 0 }}
    >
      ← Назад
    </button>
  )
}
