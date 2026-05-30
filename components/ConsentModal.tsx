"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "../lib/useSession"

const CONSENT_KEY = "poputtky_consent_v1"
const RULES_VERSION = "1.0"

export default function ConsentModal() {
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState(false)
  const { isLoggedIn, user } = useSession()

  useEffect(() => {
    const given = localStorage.getItem(CONSENT_KEY)
    if (!given) setVisible(true)
  }, [])

  async function handleAccept() {
    if (!checked) { setError(true); setCollapsed(false); return }
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      version: RULES_VERSION,
      date: new Date().toISOString(),
    }))
    if (isLoggedIn && user?.id) {
      try {
        await fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: RULES_VERSION }),
        })
      } catch { /* не критично */ }
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-lg bg-white border-t border-[#E5E7EB] shadow-2xl transition-all duration-300"
        style={{ borderRadius: "16px 16px 0 0" }}
      >
        {/* Шапка — завжди видима */}
        <div
          className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-sm font-bold text-[#111827]">Правила сервісу</span>
            {!collapsed && <span className="text-xs text-[#E53935] font-medium ml-1">• потрібна згода</span>}
          </div>
          <span className="text-[#9CA3AF] text-lg leading-none">{collapsed ? "▲" : "▼"}</span>
        </div>

        {/* Тіло — згортається */}
        {!collapsed && (
          <div className="px-5 pb-5">
            <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
              Будь ласка, ознайомтесь з{" "}
              <Link href="/rules" target="_blank" className="text-[#5B8FD9] underline font-medium">
                правилами сервісу
              </Link>
              {" "}та підтвердіть згоду. Ви можете згорнути цю плашку кнопкою ▼ щоб читати правила.
            </p>

            <label className="flex items-start gap-3 cursor-pointer mb-4 select-none"
              onClick={() => { setChecked(c => !c); setError(false) }}>
              <div className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                style={checked
                  ? { background: "#5B8FD9", borderColor: "#5B8FD9" }
                  : { background: "white", borderColor: error ? "#E53935" : "#D1D5DB" }}>
                {checked && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#374151] leading-relaxed">
                Я прочитав(-ла) і погоджуюсь з правилами та обробкою персональних даних відповідно до GDPR і Закону України.
              </span>
            </label>

            {error && (
              <p className="text-xs text-[#E53935] mb-3 flex items-center gap-1">
                <span>⚠</span> Будь ласка, поставте галочку
              </p>
            )}

            <button
              onClick={handleAccept}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "#5B8FD9", boxShadow: "0 4px 12px rgba(91,143,217,0.3)" }}
            >
              Погоджуюсь та продовжую
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
