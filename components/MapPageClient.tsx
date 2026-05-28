"use client"
import Link from "next/link"
import dynamic from "next/dynamic"

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 440, width: "100%", borderRadius: 16,
      background: "#E5E7EB", display: "flex",
      alignItems: "center", justifyContent: "center",
      color: "#9CA3AF", fontSize: 14,
    }}>
      Завантаження карти…
    </div>
  ),
})

interface Announcement {
  _id: string
  role: "driver" | "passenger"
  from: string
  to: string
  aiText: string
  telegramUsername?: string
  authorName?: string
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  isRoundTrip?: boolean
  returnTime?: string
  departureTime?: string
  waypoints?: { name: string; lat: number; lng: number }[]
  seats?: number
  tripScope?: "suburban" | "intercity"
  tripType?: "once" | "regular"
}

interface Props {
  announcements: Announcement[]
}

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

export default function MapPageClient({ announcements }: Props) {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Хедер */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <LogoSVG />
          <div className="leading-tight">
            <div className="text-lg font-extrabold text-[#111827] tracking-tight">
              Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
            </div>
            <div className="text-[10px] text-[#9CA3AF] font-normal">приміські поїздки</div>
          </div>
        </Link>
        <Link
          href="/"
          className="ml-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold no-underline border border-[#E5E7EB] text-[#374151] bg-white"
        >
          ☰ Список
        </Link>
      </header>

      {/* Карта — завжди видима, ініціалізується одразу */}
      <div className="px-4 pt-3 pb-24">
        <LeafletMap announcements={announcements} />
        <div className="mt-3 flex flex-wrap gap-3 justify-center text-xs text-[#9CA3AF]">
          <span className="flex items-center gap-1"><span style={{ color: "#5B8FD9" }}>●</span> Коло — точка відправлення</span>
          <span className="flex items-center gap-1"><span style={{ color: "#E53935" }}>📍</span> Крапля — пункт призначення</span>
        </div>
      </div>

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
