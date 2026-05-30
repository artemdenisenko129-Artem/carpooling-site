"use client"
import { useRouter } from "next/navigation"

export default function BackButton() {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const back = params.get("back")
      if (back) {
        router.push(decodeURIComponent(back))
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
