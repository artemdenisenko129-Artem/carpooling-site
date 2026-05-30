"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "../lib/useSession"

const CONSENT_KEY = "poputtky_consent_v1"
const RULES_VERSION = "1.0"

export default function ConsentModal() {
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState(false)
  const { isLoggedIn, user } = useSession()

  useEffect(() => {
    const given = localStorage.getItem(CONSENT_KEY)
    if (!given) setVisible(true)
  }, [])

  async function handleAccept() {
    if (!checked) { setError(true); return }
    // 1. Зберігаємо в браузері
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      version: RULES_VERSION,
      date: new Date().toISOString(),
    }))
    // 2. Якщо залогінений — фіксуємо в БД
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl px-6 py-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <h2 className="text-base font-extrabold text-[#111827]">Ласкаво просимо до ПопуткиUA</h2>
        </div>
        <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
          Перш ніж продовжити, будь ласка, ознайомтесь з правилами сервісу та політикою конфіденційності.
        </p>

        <label className="flex items-start gap-3 cursor-pointer mb-5 select-none"
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
            Я прочитав(-ла) і погоджуюсь з{" "}
            <Link href="/rules" target="_blank"
              className="text-[#5B8FD9] underline font-medium"
              onClick={e => e.stopPropagation()}>
              Правилами сервісу
            </Link>
            {" "}та обробкою моїх персональних даних відповідно до GDPR і Закону України «Про захист персональних даних».
          </span>
        </label>

        {error && (
          <p className="text-xs text-[#E53935] mb-3 flex items-center gap-1">
            <span>⚠</span> Будь ласка, підтвердіть згоду з правилами
          </p>
        )}

        <button
          onClick={handleAccept}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: "#5B8FD9", boxShadow: "0 4px 12px rgba(91,143,217,0.3)" }}
        >
          Погоджуюсь та продовжую
        </button>

        <p className="text-[11px] text-[#9CA3AF] text-center mt-3 leading-relaxed">
          Дата вашої згоди фіксується. Це необхідно для підтвердження виконання вимог законодавства.
        </p>
      </div>
    </div>
  )
}
