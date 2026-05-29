"use client"
import { useEffect, useState } from "react"

export default function TelegramAuthPage() {
  const [status, setStatus] = useState("Входимо через Telegram...")

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const search = window.location.search.slice(1)
    // Telegram may send via hash OR query string — handle both
    const raw = hash || search
    if (!raw) {
      setStatus("Помилка: дані не отримано")
      setTimeout(() => { window.location.href = "/login?error=tg_no_data" }, 2000)
      return
    }

    const params = new URLSearchParams(raw)
    const data: Record<string, string> = {}
    params.forEach((v, k) => { data[k] = v })

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setStatus("Успішно! Перенаправляємо...")
          window.location.href = data.next || "/"
        } else {
          setStatus("Помилка авторизації")
          setTimeout(() => { window.location.href = "/login?error=tg_hash" }, 2000)
        }
      })
      .catch(() => {
        setStatus("Помилка з\'єднання")
        setTimeout(() => { window.location.href = "/login?error=tg_conn" }, 2000)
      })
  }, [])

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F4F6" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #E5E7EB", borderTopColor: "#229ED9", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#6B7280", fontSize: 14 }}>{status}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
