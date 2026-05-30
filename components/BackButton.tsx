"use client"
import { useRouter } from "next/navigation"

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-sm font-semibold transition-colors"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#5B8FD9",
        padding: 0,
      }}
    >
      ← Назад
    </button>
  )
}
