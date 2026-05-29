"use client"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false })

interface Announcement {
  _id: string; role: "driver" | "passenger"
  from: string; to: string; aiText: string
  telegramUsername?: string; authorName?: string
  fromLat?: number; fromLng?: number; toLat?: number; toLng?: number
  isRoundTrip?: boolean; returnTime?: string; departureTime?: string
  waypoints?: { name: string; lat: number; lng: number }[]
  seats?: number; tripScope?: "suburban" | "intercity"; tripType?: "once" | "regular"
}

interface Props { announcements: Announcement[] }

function LogoSVG() {
  return (
    <svg width="24" height="30" viewBox="0 0 170 215" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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

function normalize(s: string) { return s.toLowerCase().trim() }

export default function MapPageClient({ announcements }: Props) {
  const [searchFrom, setSearchFrom] = useState("")
  const [searchTo, setSearchTo]   = useState("")
  const [roleFilter, setRoleFilter] = useState<"all"|"driver"|"passenger">("all")

  const filtered = announcements.filter(a => {
    if (roleFilter !== "all" && a.role !== roleFilter) return false
    if (searchFrom && !normalize(a.from).includes(normalize(searchFrom))) return false
    if (searchTo   && !normalize(a.to).includes(normalize(searchTo)))     return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Закріплений верхній блок */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <header className="border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
            <LogoSVG />
            <div className="leading-tight">
              <div className="text-lg font-extrabold text-[#111827] tracking-tight">Попутки<span style={{ color: "#5B8FD9" }}>UA</span></div>
              <div className="text-[10px] text-[#9CA3AF] font-normal">приміські поїздки</div>
            </div>
          </Link>
        </header>

        {/* Пошук */}
        <div className="border-b border-[#E5E7EB] px-4 py-2 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={searchFrom} onChange={e => setSearchFrom(e.target.value)}
              placeholder="Звідки…"
              className="flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#5B8FD9]"
            />
            <input
              value={searchTo} onChange={e => setSearchTo(e.target.value)}
              placeholder="Куди…"
              className="flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#5B8FD9]"
            />
            {(searchFrom || searchTo) && (
              <button onClick={() => { setSearchFrom(""); setSearchTo("") }}
                className="text-[#9CA3AF] text-lg px-1">×</button>
            )}
          </div>
          <div className="flex gap-2">
            {(["all","driver","passenger"] as const).map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className="rounded-full px-3 py-1 text-xs font-semibold border transition-colors"
                style={{
                  background: roleFilter === r ? "#5B8FD9" : "white",
                  color: roleFilter === r ? "white" : "#374151",
                  borderColor: roleFilter === r ? "#5B8FD9" : "#E5E7EB",
                }}>
                {r === "all" ? "Всі" : r === "driver" ? "🚗 Водії" : "👤 Пасажири"}
              </button>
            ))}
            <span className="ml-auto text-xs text-[#9CA3AF] self-center">{filtered.length} маршрутів</span>
          </div>
        </div>

        {/* Перемикач список/карта */}
        <div className="border-b border-[#E5E7EB] flex">
          <Link
            href="/"
            className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all no-underline"
            style={{ color: "#9CA3AF", borderColor: "transparent" }}
          >
            ☰ Список
          </Link>
          <button
            className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all"
            style={{ color: "#5B8FD9", borderColor: "#5B8FD9", fontWeight: 700 }}
            disabled
          >
            🗺 Карта
          </button>
        </div>
      </div>{/* кінець sticky блоку */}

      <div className="px-4 pt-3 pb-24">
        <LeafletMap announcements={filtered} />
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-5 pt-3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(243,244,246,1) 60%, rgba(243,244,246,0))" }}>
        <Link href="/new"
          className="pointer-events-auto block text-center rounded-2xl text-base font-bold text-white no-underline transition-colors py-4"
          style={{ background: "#5B8FD9", boxShadow: "0 4px 20px rgba(91,143,217,0.4)" }}>
          + Створити оголошення
        </Link>
      </div>
    </div>
  )
}
