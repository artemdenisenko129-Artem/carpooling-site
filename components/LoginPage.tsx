"use client"
import { useState } from "react"
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const errorParam  = searchParams.get("error")

  const [loading, setLoading]   = useState(false)
  const [tgLoading, setTgLoading] = useState(false)
  const [error, setError]       = useState(errorParam ? "Помилка входу. Спробуй ще раз." : "")

  // Google OAuth — повний редирект сторінки
  function handleGoogleLogin() {
    setLoading(true)
    window.location.href = "/api/auth/google?callbackUrl=" + encodeURIComponent(callbackUrl)
  }

  // Telegram OAuth — повний редирект сторінки (без попапу, надійно)
  function handleTelegramLogin() {
    setTgLoading(true)
    window.location.href = "/api/auth/telegram-url?next=" + encodeURIComponent(callbackUrl)
  }

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
          <p className="text-sm text-[#6B7280] mb-5">
            Щоб розмістити оголошення або побачити контакти — увійдіть зручним способом.
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] transition-colors mb-3"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: "#E5E7EB", borderTopColor: "#374151" }} />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Перенаправлення..." : "Увійти через Google"}
          </button>

          {/* Роздільник */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">або</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          {/* Telegram — кнопка з повним редиректом */}
          <button
            onClick={handleTelegramLogin}
            disabled={tgLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#229ED9", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
          >
            {tgLoading ? (
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white" }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 14.002l-2.95-.924c-.64-.203-.654-.64.136-.949l11.526-4.443c.534-.194 1.001.13.69.562z"/>
              </svg>
            )}
            {tgLoading ? "Перенаправлення..." : "Увійти через Telegram"}
          </button>

          {error && (
            <p className="text-xs text-[#E53935] text-center mb-3">{error}</p>
          )}

          <p className="text-[11px] text-[#9CA3AF] text-center leading-relaxed mt-3">
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
