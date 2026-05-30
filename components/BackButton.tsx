"use client"
import { useRouter } from "next/navigation"

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 9999,
        background: "white",
        border: "1.5px solid #E5E7EB",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 700,
        color: "#374151",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      ← Назад
    </button>
  )
}
