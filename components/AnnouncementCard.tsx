"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Announcement } from "../types/announcement"

interface Props {
  announcement: Announcement
  isLoggedIn?: boolean
  currentUserId?: string
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

function getInitials(username: string, authorName?: string): string {
  if (authorName) return authorName.charAt(0).toUpperCase()
  const clean = (username || "").replace("@", "").trim()
  return clean ? clean.charAt(0).toUpperCase() : "?"
}

const DAY_LABELS: Record<string, string> = {
  mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт",
  fri: "Пт", sat: "Сб", sun: "Нд",
}
const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"]

function formatSchedule(tripType?: string, departureDate?: string, schedule?: string[], departureTime?: string): string {
  const time = departureTime ? ` о ${departureTime}` : ""
  if (tripType === "once" && departureDate) {
    try {
      const d = new Date(departureDate)
      return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) + time
    } catch { return departureDate + time }
  }
  if (schedule && schedule.length > 0) {
    const days = DAY_ORDER.filter(d => schedule.includes(d)).map(d => DAY_LABELS[d]).join(", ")
    return days + time
  }
  return time.trim()
}

function seatsLabel(seats: number, role: "driver" | "passenger"): string {
  const n = seats
  const word = n === 1 ? "місце" : n < 5 ? "місця" : "місць"
  return role === "driver" ? `${n} ${word}` : `${n} ${n === 1 ? "пасажир" : n < 5 ? "пасажири" : "пасажирів"}`
}

function ContactBlock({ contact }: { contact: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(contact).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const isPhone = /^\+?\d[\d\s\-()+]{6,}$/.test(contact.trim())
  return (
    <div
      className="flex items-center justify-between gap-2 w-full py-3 px-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-sm font-semibold text-[#374151] truncate">
        {isPhone ? "\u{1F4DE} " : "\u{1F4AC} "}{contact}
      </span>
      <button
        onClick={handleCopy}
        className="shrink-0 text-xs font-bold px-3 py-1 rounded-full transition-all"
        style={copied
          ? { background: "#D1FAE5", color: "#065F46" }
          : { background: "#EBF2FC", color: "#3A6BBF" }
        }
      >
        {copied ? "\u2713 \u0421\u043a\u043e\u043f\u0456\u044e\u0432\u0430\u043d\u043e" : "\u041a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438"}
      </button>
    </div>
  )
}

export default function AnnouncementCard({ announcement: a, isLoggedIn = false, currentUserId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const router = useRouter()
  const isDriver = a.role === "driver"
  const isOwner = Boolean(currentUserId && a.authorId && currentUserId === a.authorId)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Деактивувати оголошення? Воно буде збережено в архіві — за прямим посиланням воно залишиться доступним.")) return
    const res = await fetch(`/api/announcements/${a._id}`, { method: "DELETE" })
    if (res.ok) setDeleted(true)
  }

  if (deleted) return (
    <div className="bg-[#F9FAFB] rounded-2xl border border-dashed border-[#D1D5DB] px-4 py-3 text-center">
      <p className="text-sm text-[#6B7280]">✓ Оголошення деактивовано</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">Збережено в архіві — за прямим посиланням воно залишається доступним</p>
    </div>
  )

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-[#E5E7EB] cursor-pointer transition-shadow"
      style={expanded
        ? { borderColor: "#5B8FD9", boxShadow: "0 4px 12px rgba(91,143,217,0.15)" }
        : { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
      }
    >
      {/* Основна частина */}
      <div className="p-4">
        {/* Верхній рядок */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={isDriver
                ? { background: "#EBF2FC", color: "#3A6BBF" }
                : { background: "#FDECEA", color: "#E53935" }
              }
            >
              {getInitials(a.telegramUsername ?? "", a.authorName)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#111827] truncate">
                {a.authorName ?? "Анонімно"}
              </div>
              <div className="text-xs text-[#9CA3AF]">{formatDate(a.createdAt ?? "")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide"
              style={isDriver
                ? { background: "#EBF2FC", color: "#3A6BBF" }
                : { background: "#FDECEA", color: "#E53935" }
              }
            >
              {isDriver ? "Водій" : "Пасажир"}
            </span>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-[11px] font-bold px-2 py-1 rounded-full bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#FDECEA] hover:text-[#E53935] transition-all"
                title="Видалити оголошення"
                aria-label="Видалити"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Маршрут */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-base font-extrabold text-[#111827] leading-tight">{a.from}</span>
          {(a.waypoints ?? []).map((wp, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-[#9CA3AF] text-sm shrink-0">→</span>
              <span className="text-base font-extrabold text-[#111827] leading-tight">{wp.name}</span>
            </span>
          ))}
          <span className="text-[#9CA3AF] text-sm shrink-0">→</span>
          <span className="text-base font-extrabold text-[#111827] leading-tight">{a.to}</span>
          {a.isRoundTrip && (
            <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full shrink-0">↩ туди-назад</span>
          )}
        </div>

        {/* Мета-чіпи */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(() => {
            const sched = formatSchedule(a.tripType, a.departureDate, a.schedule, a.departureTime)
            return sched ? (
              <span className="text-xs bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded-full">&#128337; {sched}</span>
            ) : null
          })()}
          {a.isRoundTrip && a.returnTime && (
            <span className="text-xs bg-[#D1FAE5] text-[#065F46] px-2 py-0.5 rounded-full">
              &#8617; назад {a.returnDate
                ? (() => { try { return new Date(a.returnDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) + " " } catch { return a.returnDate + " " } })()
                : ""}о {a.returnTime}
            </span>
          )}
          {a.seats != null && a.seats > 0 && (
            <span className="text-xs bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded-full">&#128100; {seatsLabel(a.seats, a.role)}</span>
          )}
          {a.community && (
            <span className="text-xs bg-[#EBF2FC] text-[#3A6BBF] px-2 py-0.5 rounded-full">&#127968; {a.community}</span>
          )}
          {a.tripScope === "intercity" && (
            <span className="text-xs bg-[#F0FDF4] text-[#065F46] px-2 py-0.5 rounded-full">🛣 Міжміська</span>
          )}
          {a._matchedAsReturn && (
            <span className="text-xs bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full">&#8617; знайдено як зворотній</span>
          )}
        </div>

        {/* Опис */}
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
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs" style={{ color: "#5B8FD9" }}>
              Натисніть щоб побачити контакт →
            </p>
            <Link
              href={`/announcement/${a._id}`}
              onClick={e => e.stopPropagation()}
              className="text-xs no-underline"
              style={{ color: "#9CA3AF" }}
            >
              Детальніше ↗
            </Link>
          </div>
        )}
      </div>

      {/* Розгорнута зона контакту */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-3 border-t border-[#F3F4F6]"
          onClick={(e) => e.stopPropagation()}
        >
          {!isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 bg-[#F9FAFB] border border-dashed border-[#D1D5DB] rounded-xl p-3 mb-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-[#374151]">Контакт прихований</p>
                  <p className="text-xs text-[#9CA3AF]">Увійдіть, щоб побачити дані для зв&apos;язку</p>
                </div>
              </div>
              <button
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: "#5B8FD9" }}
                onClick={() => router.push("/login")}
              >
                Увійти через Google
              </button>
            </>
          ) : (
            <div className="space-y-2">
              {a.telegramUsername && (
                <a
                  href={`https://t.me/${a.telegramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ background: "#229ED9" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  ✈️ Написати в Telegram (@{a.telegramUsername})
                </a>
              )}
              {a.phone && (
                <ContactBlock contact={a.phone} />
              )}
              {!a.telegramUsername && !a.phone && (
                <p className="text-sm text-[#9CA3AF] text-center py-2">Автор не вказав контакт</p>
              )}
              {(a.fromLat != null && a.toLat != null) && (
                <a
                  href={`/?view=map&id=${a._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors mt-1"
                  style={{ background: "#F0FDF4", color: "#16A34A", border: "1.5px solid #4ADE80" }}
                >
                  🗺 Показати на карті
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
