"use client"
import { useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function LogoSVG() {
  return (
    <svg width="44" height="44" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 70 Q18 50 38 48 Q58 46 58 26 Q58 10 42 8"
        stroke="#1a1a2e" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M18 70 Q18 50 38 48 Q58 46 58 26 Q58 10 42 8"
        stroke="#5B8FD9" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="42" cy="8" r="9" fill="#E53935" />
      <circle cx="42" cy="8" r="3.5" fill="white" />
      <path d="M42 17 L38.5 23 L45.5 23 Z" fill="#E53935" />
      <circle cx="18" cy="70" r="9" fill="#5B8FD9" />
      <circle cx="18" cy="70" r="3.5" fill="white" />
      <path d="M18 79 L14.5 85 L21.5 85 Z" fill="#5B8FD9" />
    </svg>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || "poputky_bot"

  useEffect(() => {
    // Глобальний callback — Telegram widget викличе цю функцію після авторизації
    ;(window as any).onTelegramAuth = async (user: Record<string, string | number>) => {
      setLoading(true)
      setError("")

      // Перетворюємо числові поля на рядки (Telegram повертає id і auth_date як числа)
      const creds: Record<string, string> = {}
      for (const [k, v] of Object.entries(user)) {
        creds[k] = String(v)
      }

      const result = await signIn("telegram", {
        ...creds,
        redirect: false,
      })

      if (result?.ok) {
        router.push(callbackUrl)
      } else {
        setError("Не вдалося увійти. Спробуй ще раз.")
        setLoading(false)
      }
    }

    // Завантажуємо офіційний Telegram Login Widget
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.setAttribute("data-telegram-login", botName)
    script.setAttribute("data-size", "large")
    script.setAttribute("data-onauth", "onTelegramAuth(user)")
    script.setAttribute("data-request-access", "write")
    script.async = true
    scriptRef.current = script

    const container = document.getElementById("tg-widget-container")
    if (container) container.appendChild(script)

    return () => {
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
      delete (window as any).onTelegramAuth
    }
  }, [callbackUrl, botName])

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Лого */}
        <div className="flex flex-col items-center mb-8">
          <LogoSVG />
          <h1 className="mt-3 text-2xl font-extrabold text-[#111827] tracking-tight">
            Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">приміські поїздки</p>
        </div>

        {/* Картка */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-1">Вхід до сервісу</h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Щоб розмістити оголошення або побачити контакти — увійдіть через Telegram.
          </p>

          {/* Telegram Widget контейнер */}
          <div
            id="tg-widget-container"
            className="flex justify-center mb-4"
            style={{ minHeight: 48 }}
          >
            {loading && (
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#5B8FD9", borderTopColor: "transparent" }}
                />
                Виконується вхід...
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-[#E53935] text-center mb-3">{error}</p>
          )}

          <p className="text-[11px] text-[#9CA3AF] text-center leading-relaxed">
            Входячи, ви погоджуєтесь з{" "}
            <a href="#" className="underline hover:text-[#5B8FD9]">Правилами сервісу</a>{" "}
            та{" "}
            <a href="#" className="underline hover:text-[#5B8FD9]">Політикою конфіденційності</a>.
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
