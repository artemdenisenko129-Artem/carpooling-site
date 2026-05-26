"use client"
import { useState, useTransition, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, logout } from "../lib/useSession"
import AnnouncementCard from "./AnnouncementCard"
import PlaceAutocomplete from "./PlaceAutocomplete"

const LeafletMap = lazy(() => import("./LeafletMap"))

function LogoSVG() {
  return (
    <svg width="28" height="36" viewBox="0 0 170 215" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M100 5C126 5 135 50 121 97C107 144 107 188 121 205" stroke="#1A1A2E" strokeWidth="42" strokeLinecap="round"/>
      <path d="M58 5C84 5 93 50 79 97C65 144 65 188 79 205" stroke="#5B8FD9" strokeWidth="42" strokeLinecap="round"/>
      <path d="M79 5C105 5 114 50 100 97C86 144 86 188 100 205" stroke="white" strokeWidth="5" strokeLinecap="round"/>
      <path d="M58 2C41 2 28 16 28 33C28 51 58 79 58 79C58 79 88 51 88 33C88 16 75 2 58 2Z" fill="#E53935"/>
      <circle cx="58" cy="31" r="13" fill="white"/>
      <circle cx="58" cy="31" r="5.5" fill="#CC1111"/>
      <path d="M103 143C91 143 80 153 80 165C80 178 103 201 103 201C103 201 126 178 126 165C126 153 115 143 103 143Z" fill="#5B8FD9"/>
      <circle cx="103" cy="163" r="11" fill="white"/>
      <circle cx="103" cy="163" r="4.5" fill="#3A6BBF"/>
    </svg>
  )
}

type RoleFilter = "all" | "driver" | "passenger"
type ViewMode = "list" | "map"
type ScopeFilter = "all" | "suburban" | "intercity"
type TripTypeFilter = "all" | "regular"

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
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  waypoints?: { name: string; lat: number; lng: number }[]
  tripType?: "once" | "regular"
  departureDate?: string
  schedule?: string[]
  departureTime?: string
  phone?: string
  community?: string
  seats?: number
  authorName?: string
  returnTime?: string
  returnDate?: string
  _matchedAsReturn?: boolean
  tripScope?: "suburban" | "intercity"
}

interface Props {
  announcements: Announcement[]
  initialFrom: string
  initialTo: string
}

export default function FeedPage({ announcements, initialFrom, initialTo }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [fromVal, setFromVal] = useState(initialFrom)
  const [toVal, setToVal]   = useState(initialTo)

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [view, setView] = useState<ViewMode>("list")
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all")
  const [tripTypeFilter, setTripTypeFilter] = useState<TripTypeFilter>("all")

  const { user, isLoggedIn } = useSession()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (fromVal.trim()) params.set("from", fromVal.trim())
    if (toVal.trim())   params.set("to",   toVal.trim())
    startTransition(() => {
      router.push(params.toString() ? "/?" + params.toString() : "/")
    })
  }

  function handleReset() {
    setFromVal("")
    setToVal("")
    startTransition(() => router.push("/"))
  }

  const filtered = announcements.filter((a) => {
    if (roleFilter === "driver"    && a.role !== "driver")    return false
    if (roleFilter === "passenger" && a.role !== "passenger") return false
    if (scopeFilter === "suburban"  && a.tripScope === "intercity") return false
    if (scopeFilter === "intercity" && a.tripScope !== "intercity") return false
    if (tripTypeFilter === "regular" && a.tripType !== "regular") return false
    return true
  })

  const isSearchActive = Boolean(initialFrom || initialTo)

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* Хедер */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <LogoSVG />
          <div className="leading-tight">
            <div className="text-lg font-extrabold text-[#111827] tracking-tight">
              Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
            </div>
            <div className="text-[10px] text-[#9CA3AF] font-normal">приміські поїздки</div>
          </div>
        </Link>

        {isLoggedIn ? (
          <button
            className="shrink-0 border border-[#E5E7EB] rounded-full px-4 py-2 text-sm font-medium text-[#374151] bg-[#F9FAFB] transition-colors"
            onClick={logout}
          >
            👤 {user?.name?.split(" ")[0] || "Профіль"} ↩
          </button>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors no-underline"
            style={{ background: "#5B8FD9" }}
          >
            Увійти
          </Link>
        )}
      </header>

      {/* Пошук */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 pt-3 pb-0">
        <form onSubmit={handleSearch}>
          <div
            className="flex items-stretch rounded-xl border transition-colors mb-3"
            style={{ background: "#F3F4F6", borderColor: isPending ? "#5B8FD9" : "#E5E7EB" }}
          >
            <div className="flex flex-col items-center justify-center gap-1 px-3 py-3 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#5B8FD9" }} />
              <div className="w-px h-4 bg-[#D1D5DB]" />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#E53935" }} />
            </div>
            <div className="flex-1 flex flex-col divide-y divide-[#E5E7EB]">
              <PlaceAutocomplete
                value={fromVal}
                onChange={(v) => setFromVal(v)}
                placeholder="Звідки..."
                dotColor="blue"
                inputClassName="bg-transparent px-1 py-2.5 text-sm text-[#111827] outline-none placeholder-[#9CA3AF] w-full"
              />
              <PlaceAutocomplete
                value={toVal}
                onChange={(v) => setToVal(v)}
                placeholder="Куди..."
                dotColor="red"
                inputClassName="bg-transparent px-1 py-2.5 text-sm text-[#111827] outline-none placeholder-[#9CA3AF] w-full"
              />
            </div>
            <button
              type="submit"
              className="px-4 text-lg font-bold text-white shrink-0 transition-colors rounded-r-xl"
              style={{ background: "#5B8FD9" }}
              aria-label="Знайти"
            >
              &rarr;
            </button>
          </div>
          {isSearchActive && (
            <button type="button" onClick={handleReset} className="text-xs text-[#9CA3AF] underline mb-2 block">
              Скинути пошук
            </button>
          )}
        </form>

        <div className="flex gap-2 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {(["all", "driver", "passenger"] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={roleFilter === r
                ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF", fontWeight: 600 }
                : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}
            >
              {r === "all" ? "🚘 Всі" : r === "driver" ? "🚗 Водій" : "💺 Пасажир"}
            </button>
          ))}

          {(["suburban", "intercity"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScopeFilter(scopeFilter === s ? "all" : s)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={scopeFilter === s
                ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF", fontWeight: 600 }
                : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}
            >
              {s === "suburban" ? "🏘 Приміська/Міська" : "🛣 Міжміська"}
            </button>
          ))}
          <button
            onClick={() => setTripTypeFilter(tripTypeFilter === "regular" ? "all" : "regular")}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={tripTypeFilter === "regular"
              ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF", fontWeight: 600 }
              : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}
          >
            🔄 Регулярно
          </button>

          {isLoggedIn ? (
            <button
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{ background: "white", borderColor: "#D1D5DB", color: "#374151" }}
              onClick={() => alert("Фільтр за вашою спільнотою (ЖК, район)")}
            >
              🏘 Спільнота
            </button>
          ) : (
            <button
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{ background: "white", borderColor: "#E5E7EB", color: "#9CA3AF" }}
              onClick={() => router.push("/login")}
            >
              🏘 Спільнота 🔒
            </button>
          )}
        </div>
      </div>

      {/* Перемикач список/карта */}
      <div className="bg-white border-b border-[#E5E7EB] flex">
        {(["list", "map"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all"
            style={view === v
              ? { color: "#5B8FD9", borderColor: "#5B8FD9", fontWeight: 700 }
              : { color: "#9CA3AF", borderColor: "transparent" }}
          >
            {v === "list" ? "☰ Список" : "🗺 Карта"}
          </button>
        ))}
      </div>

      {/* Список */}
      {view === "list" && (
        <div className="px-4 pt-3 pb-32 flex flex-col gap-3">
          <p className="text-xs text-[#9CA3AF]">
            {isSearchActive ? "Результати пошуку:" : "Останні оголошення:"}{" "}
            <span className="font-semibold text-[#6B7280]">{filtered.length}</span>
          </p>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-[#6B7280] font-medium">Нічого не знайдено</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Спробуй інший маршрут або зміни фільтри</p>
            </div>
          ) : (
            filtered.map((a) => (
              <AnnouncementCard key={a._id} announcement={a} isLoggedIn={isLoggedIn} currentUserId={user?.id} />
            ))
          )}
        </div>
      )}

      {/* Карта */}
      {view === "map" && (
        <div className="px-4 pt-3 pb-32">
          <Suspense fallback={
            <div className="rounded-2xl border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] text-sm"
              style={{ height: 400, background: "#EBF2FC" }}>
              Завантаження карти...
            </div>
          }>
            <LeafletMap announcements={filtered} />
          </Suspense>
          <div className="mt-3 flex flex-wrap gap-3 justify-center text-xs text-[#9CA3AF]">
            <span className="flex items-center gap-1"><span style={{ color: "#5B8FD9" }}>●</span> Коло — точка відправлення</span>
            <span className="flex items-center gap-1"><span style={{ color: "#E53935" }}>📍</span> Крапля — пункт призначення</span>
          </div>
        </div>
      )}

      {/* Футер */}
      <footer className="bg-white border-t border-[#E5E7EB] px-4 py-5 text-center text-xs text-[#9CA3AF]" style={{ marginBottom: 80 }}>
        <p className="mb-2">Попутки UA © 2026</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#" className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors">Правила сайту</a>
          <a href="#" className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors">Про сервіс</a>
          <a href="https://t.me/poputtky_ua" target="_blank" rel="noopener noreferrer"
            className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors">Telegram-канал</a>
        </div>
      </footer>

      {/* Кнопка створити оголошення */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-5 pt-3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(243,244,246,1) 60%, rgba(243,244,246,0))" }}>
        <Link
          href="/new"
          className="pointer-events-auto block text-center rounded-2xl text-base font-bold text-white no-underline transition-colors py-4"
          style={{ background: "#5B8FD9", boxShadow: "0 4px 20px rgba(91,143,217,0.4)" }}
        >
          + Створити оголошення
        </Link>
      </div>

    </div>
  )
}
am-канал</a>
        </div>
      </footer>

      {/* Кнопка створити оголошення */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-5 pt-3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(243,244,246,1) 60%, rgba(243,244,246,0))" }}>
        <Link
          href="/new"
          className="pointer-events-auto block text-center rounded-2xl text-base font-bold text-white no-underline transition-colors py-4"
          style={{ background: "#5B8FD9", boxShadow: "0 4px 20px rgba(91,143,217,0.4)" }}
        >
          + Створити оголошення
        </Link>
      </div>

    </div>
  )
}
