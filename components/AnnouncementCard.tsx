"use client"
import { useState } from "react"

interface Announcement {
  _id: string
  telegramUsername: string
  role: "driver" | "passenger"
  from: string
  to: string
  aiText: string
  channelMessageId?: number
  channelUsername?: string
  createdAt: string
  isRoundTrip?: boolean
}

interface Props {
  announcement: Announcement
  // TODO (Фаза 1, крок 7): передавати реальний стан авторизації після впровадження Auth.js
  isLoggedIn?: boolean
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      return "сьогодні, " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "вчора, " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
    } else {
      return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) +
        ", " + d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
    }
  } catch {
    return ""
  }
}

function getInitials(username: string): string {
  return username.replace("@", "").charAt(0).toUpperCase()
}

export default function AnnouncementCard({ announcement: a, isLoggedIn = false }: Props) {
  const [expanded, setExpanded] = useState(false)

  const isDriver = a.role === "driver"

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-[#E5E7EB] cursor-pointer transition-shadow"
      style={expanded
        ? { borderColor: "#5B8FD9", boxShadow: "0 4px 12px rgba(91,143,217,0.15)" }
        : { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
      }
    >
      {/* ── Основна частина картки ── */}
      <div className="p-4">
        {/* Верхній рядок: аватар + ім'я + бейдж ролі */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={isDriver
                ? { background: "#EBF2FC", color: "#3A6BBF" }
                : { background: "#FDECEA", color: "#E53935" }
              }
            >
              {getInitials(a.telegramUsername)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#111827] truncate">@{a.telegramUsername}</div>
              <div className="text-xs text-[#9CA3AF]">{formatDate(a.createdAt)}</div>
            </div>
          </div>
          <span
            className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shrink-0"
            style={isDriver
              ? { background: "#EBF2FC", color: "#3A6BBF" }
              : { background: "#FDECEA", color: "#E53935" }
            }
          >
            {isDriver ? "Водій" : "Пасажир"}
          </span>
        </div>

        {/* Маршрут */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-extrabold text-[#111827] leading-tight">{a.from}</span>
          <span className="text-[#9CA3AF] text-sm shrink-0">→</span>
          <span className="text-base font-extrabold text-[#111827] leading-tight">{a.to}</span>
          {a.isRoundTrip && (
            <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full shrink-0">↩ туди-назад</span>
          )}
        </div>

        {/* Опис (aiText) — обрізаний / повний */}
        <p
          className="text-sm text-[#6B7280] leading-relaxed"
          style={expanded ? {} : {
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } as React.CSSProperties}
        >
          {a.aiText}
        </p>

        {!expanded && (
          <p className="text-xs mt-1" style={{ color: "#5B8FD9" }}>
            Натисніть щоб побачити контакт →
          </p>
        )}
      </div>

      {/* ── Розгорнута зона контакту ── */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-3 border-t border-[#F3F4F6]"
          onClick={(e) => e.stopPropagation()}
        >
          {!isLoggedIn ? (
            /* Для неавторизованих — замок */
            <>
              <div className="flex items-center gap-3 bg-[#F9FAFB] border border-dashed border-[#D1D5DB] rounded-xl p-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-[#374151]">Контакт прихований</p>
                  <p className="text-xs text-[#9CA3AF]">Увійдіть, щоб побачити дані для зв&apos;язку</p>
                </div>
              </div>
              <button
                className="mt-3 w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: "#5B8FD9" }}
                onClick={() => alert("Вхід через Telegram або Google — Фаза 1, крок 7")}
              >
                Увійти через Telegram або Google
              </button>
            </>
          ) : (
            /* Для авторизованих — контакт */
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#374151]">
                <span>✈️</span>
                <span>Telegram: @{a.telegramUsername}</span>
              </div>
              <a
                href={`https://t.me/${a.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: "#229ED9" }}
                onClick={(e) => e.stopPropagation()}
              >
                ✈️ Написати в Telegram
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
