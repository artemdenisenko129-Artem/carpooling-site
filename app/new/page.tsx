"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import PlaceAutocomplete from "../../components/PlaceAutocomplete"
import { useSession } from "../../lib/useSession"

const MapPicker = dynamic(() => import("../../components/MapPicker"), { ssr: false })

function LogoSVG() {
  return (
    <svg width="22" height="28" viewBox="0 0 170 215" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const PLACEHOLDER_EXAMPLE = `Їду щодня з Ірпінь (ЖД вокзал) до Києва (Оболонь) і назад.
Виїзд ~7:00, назад ~18:00. Через Гостомель, КПП.
Є 1 місце. Пишіть в особисті.`

const DAYS = [
  { key: "mon", label: "Пн" }, { key: "tue", label: "Вт" },
  { key: "wed", label: "Ср" }, { key: "thu", label: "Чт" },
  { key: "fri", label: "Пт" }, { key: "sat", label: "Сб" },
  { key: "sun", label: "Нд" },
]

const inputCls = "w-full bg-transparent px-3 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none"

type Role = "driver" | "passenger" | ""
type TripScope = "suburban" | "intercity" | ""
type TripType = "regular" | "once" | ""

export default function NewAnnouncement() {
  const router = useRouter()
  const { user } = useSession()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mapSectionRef = useRef<HTMLDivElement>(null)
  const [mapTrigger, setMapTrigger] = useState<{ mode: "from" | "to"; t: number } | null>(null)

  const [form, setForm] = useState({
    role: "" as Role,
    tripScope: "" as TripScope,
    from: "",
    to: "",
    fromLat: null as number | null,
    fromLng: null as number | null,
    toLat:   null as number | null,
    toLng:   null as number | null,
    waypoints: [] as { name: string; lat: number | null; lng: number | null }[],
    aiText: "",
    isRoundTrip: false,
    tripType: "" as TripType,
    departureDate: "",
    schedule: [] as string[],
    departureTime: "",
    returnTime: "",
    returnDate: "",
    seats: 0,
    telegramUsername: "",
    phone: "",
    community: "",
  })

  const [waypointTriggerIdx, setWaypointTriggerIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    const tg = user.telegramUsername
      ? (user.telegramUsername.startsWith("@") ? user.telegramUsername : "@" + user.telegramUsername)
      : ""
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => {
        const tgFromProfile = d.telegramHandle
          ? (d.telegramHandle.startsWith("@") ? d.telegramHandle : "@" + d.telegramHandle)
          : ""
        setForm(f => ({
          ...f,
          telegramUsername: tg || tgFromProfile || f.telegramUsername,
          phone: d.phone || f.phone,
          community: d.community || f.community,
        }))
      })
      .catch(() => {
        if (tg) setForm(f => ({ ...f, telegramUsername: tg }))
      })
  }, [user])

  function activateMap(mode: "from" | "to") {
    setMapTrigger({ mode, t: Date.now() })
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 80)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.role) newErrors.role = "Оберіть хто ви — водій чи пасажир"
    if (!form.tripScope) newErrors.tripScope = "Оберіть тип маршруту"
    if (!form.tripType) newErrors.tripType = "Оберіть як часто їдете"
    if (form.role === "driver" && !form.seats) newErrors.seats = "Вкажіть кількість вільних місць"
    if (!form.telegramUsername.trim() && !form.phone.trim()) newErrors.contact = "Вкажіть хоча б один спосіб зв'язку"
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Прокрутити до першої помилки
      setTimeout(() => {
        document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Помилка публікації")
      }
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "Невідома помилка" })
    } finally {
      setLoading(false)
    }
  }

  const pinBtn = (mode: "from" | "to") => (
    <button
      type="button"
      onClick={() => activateMap(mode)}
      title="Вибрати на карті"
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{ background: "#EBF2FC", color: "#3A6BBF", fontSize: 15 }}
    >
      📍
    </button>
  )

  const dotFrom = (
    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#5B8FD9",
      border: "2.5px solid white", boxShadow: "0 0 0 2px #5B8FD9", flexShrink: 0 }} />
  )
  const dotWay = (
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D1D5DB",
      border: "2px solid white", boxShadow: "0 0 0 1.5px #D1D5DB", flexShrink: 0 }} />
  )
  const dotTo = (
    <div style={{ width: 14, height: 18, position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 1, width: 12, height: 12,
        background: "#E53935", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)",
        border: "2.5px solid white", boxShadow: "0 0 0 2px #E53935" }} />
    </div>
  )
  const line = <div style={{ width: 2, background: "#E5E7EB", flex: 1, minHeight: 8, margin: "2px 0" }} />

  function errBox(key: string) {
    if (!errors[key]) return null
    return (
      <p data-error className="text-xs text-[#E53935] mt-1.5 flex items-center gap-1">
        <span>⚠</span> {errors[key]}
      </p>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <LogoSVG />
          <span className="text-base font-extrabold text-[#111827]">
            Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
          </span>
        </Link>
        <Link href="/" className="text-sm text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline">
          ← На головну
        </Link>
      </header>

      <div className="px-4 py-6 pb-10 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-[#111827] mb-1">Нове оголошення</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">
          Розкажіть про свій маршрут — оголошення з'явиться на сайті та в Telegram-каналі
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ─── 1. Хто я ─── */}
          <div>
            <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Хто я</p>
            <div className="flex gap-3 mb-3"
              style={errors.role ? { borderRadius: 12, outline: "2px solid #E53935", outlineOffset: 2 } : {}}>
              {[
                { val: "driver",    label: "🚗 Я — водій" },
                { val: "passenger", label: "💺 Я — пасажир" },
              ].map(({ val, label }) => (
                <button key={val} type="button"
                  onClick={() => { setForm(f => ({ ...f, role: val as Role })); setErrors(e => ({ ...e, role: "" })) }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.role === val
                    ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                    : { background: "white",   borderColor: "#E5E7EB",  color: "#374151" }}
                >{label}</button>
              ))}
            </div>
            {errBox("role")}

            <div className="flex gap-3"
              style={errors.tripScope ? { borderRadius: 12, outline: "2px solid #E53935", outlineOffset: 2 } : {}}>
              {([
                { val: "suburban",  label: "🏘 Приміська/Міська" },
                { val: "intercity", label: "🛣 Міжміська" },
              ] as const).map(({ val, label }) => (
                <button key={val} type="button"
                  onClick={() => { setForm(f => ({ ...f, tripScope: val })); setErrors(e => ({ ...e, tripScope: "" })) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.tripScope === val
                    ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                    : { background: "white",   borderColor: "#E5E7EB",  color: "#374151" }}
                >{label}</button>
              ))}
            </div>
            {errBox("tripScope")}
          </div>

          {/* ─── 2. Маршрут ─── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-3">

            <div className="flex items-stretch gap-3">
              <div className="flex flex-col items-center" style={{ width: 16, paddingTop: 14 }}>
                {dotFrom}
                {line}
              </div>
              <div className="flex-1 py-1">
                <PlaceAutocomplete
                  value={form.from}
                  onChange={(v, place) => setForm(f => ({
                    ...f, from: v,
                    fromLat: place?.lat ?? (v ? f.fromLat : null),
                    fromLng: place?.lng ?? (v ? f.fromLng : null),
                  }))}
                  placeholder="Звідки"
                  dotColor="blue"
                  inputClassName={inputCls}
                />
              </div>
              {pinBtn("from")}
            </div>

            {form.waypoints.map((wp, idx) => (
              <div key={idx} className="flex items-stretch gap-3">
                <div className="flex flex-col items-center" style={{ width: 16 }}>
                  {line}{dotWay}{line}
                </div>
                <div className="flex-1 py-1">
                  <PlaceAutocomplete
                    value={wp.name}
                    onChange={(v, place) => {
                      const updated = [...form.waypoints]
                      updated[idx] = { name: v, lat: place?.lat ?? null, lng: place?.lng ?? null }
                      setForm(f => ({ ...f, waypoints: updated }))
                    }}
                    placeholder={`Зупинка ${idx + 1}`}
                    dotColor="blue"
                    inputClassName={inputCls}
                  />
                </div>
                <button type="button"
                  onClick={() => { setWaypointTriggerIdx(idx); setTimeout(() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80) }}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: "#EBF2FC", color: "#3A6BBF", fontSize: 14 }}
                >📍</button>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, waypoints: f.waypoints.filter((_, i) => i !== idx) }))}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#E53935] hover:bg-[#FDECEA] transition-all"
                >×</button>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center" style={{ width: 16 }}>{line}</div>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, waypoints: [...f.waypoints, { name: "", lat: null, lng: null }] }))}
                className="text-xs font-medium py-1 text-[#9CA3AF] hover:text-[#5B8FD9] transition-colors"
              >+ Додати зупинку</button>
            </div>

            <div className="flex items-stretch gap-3">
              <div className="flex flex-col items-center" style={{ width: 16, paddingBottom: 4 }}>
                {line}{dotTo}
              </div>
              <div className="flex-1 py-1">
                <PlaceAutocomplete
                  value={form.to}
                  onChange={(v, place) => setForm(f => ({
                    ...f, to: v,
                    toLat: place?.lat ?? (v ? f.toLat : null),
                    toLng: place?.lng ?? (v ? f.toLng : null),
                  }))}
                  placeholder="Куди"
                  dotColor="red"
                  inputClassName={inputCls}
                />
              </div>
              {pinBtn("to")}
            </div>
          </div>

          {/* ─── 3. Карта ─── */}
          <div ref={mapSectionRef}>
            <Suspense fallback={
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center text-xs text-[#9CA3AF]"
                style={{ height: 100 }}>Завантаження карти...</div>
            }>
              <MapPicker
                fromLat={form.fromLat} fromLng={form.fromLng}
                toLat={form.toLat}     toLng={form.toLng}
                fromName={form.from}   toName={form.to}
                mapTrigger={mapTrigger}
                onFromChange={(name, lat, lng) => setForm(f => ({ ...f, from: name, fromLat: lat, fromLng: lng }))}
                onToChange={(name, lat, lng)   => setForm(f => ({ ...f, to: name,   toLat: lat,   toLng: lng }))}
              />
            </Suspense>
          </div>

          {/* ─── 4. Опис ─── */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Розкажіть про маршрут
            </label>
            <textarea
              required
              rows={5}
              placeholder={PLACEHOLDER_EXAMPLE}
              value={form.aiText}
              onChange={e => setForm(f => ({ ...f, aiText: e.target.value }))}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9] resize-none"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Час виїзду, зупинки, кількість місць — все що може бути корисним
            </p>
          </div>

          {/* ─── 5. Їду ─── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-3"
            style={errors.tripType ? { borderColor: "#E53935" } : {}}>
            <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Їду</p>

            <div className="flex gap-2">
              {([
                { val: "regular", label: "🔄 Регулярно" },
                { val: "once",    label: "📅 Одного разу" },
              ] as const).map(({ val, label }) => (
                <button key={val} type="button"
                  onClick={() => { setForm(f => ({ ...f, tripType: val })); setErrors(e => ({ ...e, tripType: "" })) }}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.tripType === val
                    ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                    : { background: "#F9FAFB", borderColor: "#E5E7EB", color: "#6B7280" }}
                >{label}</button>
              ))}
            </div>
            {errBox("tripType")}

            {form.tripType === "once" && (
              <input type="date"
                value={form.departureDate}
                onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#5B8FD9]"
              />
            )}

            {form.tripType === "regular" && (
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map(({ key, label }) => (
                  <button key={key} type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      schedule: f.schedule.includes(key)
                        ? f.schedule.filter(d => d !== key)
                        : [...f.schedule, key],
                    }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
                    style={form.schedule.includes(key)
                      ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                      : { background: "#F9FAFB", borderColor: "#E5E7EB", color: "#6B7280" }}
                  >{label}</button>
                ))}
              </div>
            )}

            {form.tripType && (
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Час виїзду</label>
                <input type="time"
                  value={form.departureTime}
                  onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#5B8FD9]"
                />
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
                style={form.isRoundTrip
                  ? { background: "#5B8FD9", borderColor: "#5B8FD9" }
                  : { background: "white",   borderColor: "#D1D5DB" }}
                onClick={() => setForm(f => ({ ...f, isRoundTrip: !f.isRoundTrip }))}
              >
                {form.isRoundTrip && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#374151] font-medium">↩ Їду туди і назад</span>
            </label>

            {form.isRoundTrip && (
              <div className="pl-8 flex flex-col gap-2 border-l-2 border-[#EBF2FC] ml-2">
                {form.tripType === "once" && (
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Дата повернення</label>
                    <input type="date"
                      value={form.returnDate}
                      onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                      min={form.departureDate || new Date().toISOString().slice(0, 10)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#5B8FD9]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Час повернення</label>
                  <input type="time"
                    value={form.returnTime}
                    onChange={e => setForm(f => ({ ...f, returnTime: e.target.value }))}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#5B8FD9]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─── 6. Додатково ─── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Додатково</p>

            {form.role === "driver" && (
              <div>
                <label className="block text-xs text-[#6B7280] mb-2">Вільних місць</label>
                <div className="flex gap-2 flex-wrap"
                  style={errors.seats ? { outline: "2px solid #E53935", borderRadius: 10, outlineOffset: 2 } : {}}>
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <button key={n} type="button"
                      onClick={() => { setForm(f => ({ ...f, seats: n })); setErrors(e => ({ ...e, seats: "" })) }}
                      className="w-9 h-9 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={form.seats === n
                        ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                        : { background: "#F9FAFB", borderColor: "#E5E7EB", color: "#6B7280" }}
                    >{n}</button>
                  ))}
                </div>
                {errBox("seats")}
              </div>
            )}

            <div>
              <label className="block text-xs text-[#6B7280] mb-1">
                Спільнота <span className="text-[#9CA3AF] normal-case">(необов'язково)</span>
              </label>
              <input type="text"
                placeholder="ЖК Новий Автограф, КПІ, Samsung Ukraine..."
                value={form.community}
                onChange={e => setForm(f => ({ ...f, community: e.target.value }))}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#5B8FD9]"
              />
              <p className="text-xs text-[#9CA3AF] mt-1">ЖК, університет, компанія або район</p>
            </div>
          </div>

          {/* ─── 7. Контакти ─── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-3"
            style={errors.contact ? { borderColor: "#E53935" } : {}}>
            <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Як зв'язатися</p>

            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Telegram</label>
              {user?.telegramUsername ? (
                <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#D1FAE5] rounded-xl px-4 py-3">
                  <span className="text-lg">✓</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#065F46] truncate">
                      @{user.telegramUsername.replace("@", "")}
                    </p>
                    <p className="text-xs text-[#6B7280]">Верифіковано через Telegram</p>
                  </div>
                </div>
              ) : (
                <input type="text"
                  placeholder="@your_username"
                  value={form.telegramUsername}
                  onChange={e => {
                    let val = e.target.value
                    if (val && !val.startsWith("@")) val = "@" + val
                    setForm(f => ({ ...f, telegramUsername: val }))
                    setErrors(err => ({ ...err, contact: "" }))
                  }}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#5B8FD9]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs text-[#6B7280] mb-1">
                Засоби зв'язку <span className="text-[#9CA3AF] normal-case">(телефон, email, Viber, Instagram...)</span>
              </label>
              <input type="text"
                placeholder="+380 50 123 45 67 · email@example.com"
                value={form.phone}
                onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(err => ({ ...err, contact: "" })) }}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#5B8FD9]"
              />
            </div>
            {errBox("contact")}
          </div>

          {errors.general && (
            <div className="bg-[#FDECEA] border border-[#FECACA] rounded-xl px-4 py-3">
              <p className="text-sm text-[#E53935] font-medium">{errors.general}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "#5B8FD9", boxShadow: "0 4px 16px rgba(91,143,217,0.4)" }}
          >
            {loading ? "Публікую..." : "Опублікувати"}
          </button>

          <p className="text-xs text-center text-[#9CA3AF]">
            Публікуючи, ви погоджуєтесь з{" "}
            <a href="/rules" className="underline" style={{ color: "#5B8FD9" }}>правилами сервісу</a>
          </p>
        </form>
      </div>
    </div>
  )
}
