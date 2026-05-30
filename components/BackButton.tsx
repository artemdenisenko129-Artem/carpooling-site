"use client"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"

const BACK_LABELS: Record<string, { label: string; href: string }> = {
  map: { label: "← На карту", href: "/map" },
}

export default function BackButton() {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get("from")
  const config = from ? BACK_LABELS[from] : null

  if (config) {
    return (
      <a href={config.href}
        className="inline-flex items-center text-sm font-semibold no-underline transition-colors"
        style={{ color: "#5B8FD9" }}>
        {config.label}
      </a>
    )
  }

  return (
    <button onClick={() => router.back()}
      className="inline-flex items-center text-sm font-semibold transition-colors"
      style={{ background: "none", border: "none", cursor: "pointer", color: "#5B8FD9", padding: 0 }}>
      ← Назад
    </button>
  )
}
