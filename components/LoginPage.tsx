"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

declare const window: Window & { onTelegramAuth?: (user: Record<string, string>) => void }

function LogoSVG() {
  return (
    <svg width="44" height="44" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 70 Q18 50 38 48 Q58 46 58 26 Q58 10 42 8" stroke="#1a1a2e" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M18 70 Q18 50 38 48 Q58 46 58 26 Q58 10 42 8" stroke="#5B8FD9" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <circle cx="42" cy="8" r="9" fill="#E53935"/>
      <circle cx="42" cy="8" r="3.5" fill="white"/>
      <circle cx="18" cy="70" r="9" fill="#5B8FD9"/>
      <circle cx="18" cy="70" r="3.5" fill="white"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

async function postTelegramAuth(
  user: Record<string, string>,
  callbackUrl: string,
  router: ReturnType<typeof useRouter>,
  setError: (e: string) => void,
  setTgLoading: (v: boolean) => void
) {
  try {
    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    const data = await res.json()
    if (data.ok) {
      router.replace(callbackUrl)
      router.refresh()
    } else {
      setError("Помилка Telegram авторизації")
      setTgLoading(false)
    }
  } catch {
    setError("Помилка з'єднання")
    setTgLoading(false)
  }
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [googleLoading, setGoogleLoading] = useState(false)
  const [tgLoading, setTgLoading] = useState(false)
  const [error, setError] = useState(searchParams.get("error") ? "Помилка входу. Спробуй ще раз." : "")
  const tgRef = useRef<HTMLDivElement>(null)

  // Redirect mode: Telegram повертається на сторінку з ?tgAuthResult=<base64>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tgResult = params.get("tgAuthResult")
    if (!tgResult) return
    try {
      const user = JSON.parse(atob(tgResult)) as Record<string, string>
      setTgLoading(true)
      postTelegramAuth(user, callbackUrl, router, setError, setTgLoading)
    } catch {
      setError("Не вдалося обробити відповідь Telegram")
    }
  }, [callbackUrl, router])

  // Popup mode: Widget викликає onTelegramAuth напряму
  useEffect(() => {
    window.onTelegramAuth = (user: Record<string, string>) => {
      setTgLoading(true)
      setError("")
      postTelegramAuth(user, callbackUrl, router, setError, setTgLoading)
    }
    if (!tgRef.current) return
    tgRef.current.innerHTML = ""
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.setAttribute("data-telegram-login", "Poputtky_bot")
    script.setAttribute("data-size", "large")
    script.setAttribute("data-onauth", "onTelegramAuth(user)")
    script.setAttribute("data-request-access", "write")
    script.async = true
    tgRef.current.appendChild(script)
    return () => { delete window.onTelegramAuth }
  }, [callbackUrl, router])

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <LogoSVG />
          <h1 className="mt-3 text-2xl font-extrabold text-[#111827] tracking-tight">
            Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">приміські поїздки</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-1">Вхід до сервісу</h2>
          <p className="text-sm text-[#6B7280] mb-5">
            Щоб розмістити оголошення або побачити контакти — увійдіть зручним способом.
          </p>

          <button
            onClick={() => { setGoogleLoading(true); window.location.href = "/api/auth/google?callbackUrl=" + encodeURIComponent(callbackUrl) }}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] mb-3 transition-colors"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            {googleLoading
              ? <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#E5E7EB", borderTopColor: "#374151" }} />
              : <GoogleIcon />}
            {googleLoading ? "Перенаправлення..." : "Увійти через Google"}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">або</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <div className="flex flex-col items-center gap-2 min-h-[52px]">
            {tgLoading
              ? <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "#E5E7EB", borderTopColor: "#229ED9" }} />
                  Входимо через Telegram…
                </div>
              : <div ref={tgRef} />
            }
          </div>

          {error && <p className="text-xs text-[#E53935] text-center mt-3">{error}</p>}

          <p className="text-[11px] text-[#9CA3AF] text-center leading-relaxed mt-4">
            Входячи, ви погоджуєтесь з{" "}
            <a href="#" className="underline hover:text-[#5B8FD9]">Правилами сервісу</a>.
          </p>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm text-[#6B7280] hover:text-[#5B8FD9] transition-colors">
            ← Повернутись до оголошень
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
