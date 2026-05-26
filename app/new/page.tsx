"use client"
import { useState, useEffect, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PlaceAutocomplete from "../../components/PlaceAutocomplete"
import { useSession } from "../../lib/useSession"

const MapPicker = lazy(() => import("../../components/MapPicker"))

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

export default function NewAnnouncement() {
  const router = useRouter()
  const { user } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    telegramUsername: "",
    role: "driver",
    from: "",
    to: "",
    aiText: "",
    isRoundTrip: false,
    fromLat: null as number | null,
    fromLng: null as number | null,
    toLat:   null as number | null,
    toLng:   null as number | null,
    waypoints: [] as { name: string; lat: number | null; lng: number | null }[],
    tripType: "regular" as "once" | "regular",
    departureDate: "",
    schedule: [] as string[],
    departureTime: "",
    phone: "",
    community: "",
    seats: 1,
    returnTime: "",
    returnDate: "",
    tripScope: "suburban" as "suburban" | "intercity",
  })

  // Підставляємо Telegram username із сесії якщо є
  useEffect(() => {
    if (user?.telegramUsername && !form.telegramUsername) {
      const tg = user.telegramUsername.startsWith("@")
        ? user.telegramUsername
        : "@" + user.telegramUsername
      setForm((f) => ({ ...f, telegramUsername: tg }))
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!form.telegramUsername.trim() && !form.phone.trim()) {
      setError("Вкажіть хоча б один спосіб зв'язку — Telegram або Засоби зв'язку")
      setLoading(false)
      return
    }

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
      setError(err instanceof Error ? err.message : "Невідома помилка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* Хедер */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <LogoSVG />
          <span className="text-base font-extrabold text-[#111827]">
            Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline"
        >
          ← На головну
        </Link>
      </header>

      {/* Форма */}
      <div className="px-4 py-6 pb-10 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-[#111827] mb-1">Нове оголошення</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">Заповни форму — оголошення з&#39;явиться на сайті та в Telegram-каналі</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Telegram username */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Telegram username
            </label>
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
              <>
                <input
                  type="text"
                  placeholder="@your_username"
                  value={form.telegramUsername}
                  onChange={(e) => {
                    let val = e.target.value
                    if (val && !val.startsWith("@")) val = "@" + val
                    setForm({ ...form, telegramUsername: val })
                  }}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
                />
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Потрібен хоча б один спосіб зв&apos;язку — Telegram або поле нижче
                </p>
              </>
            )}
          </div>

          {/* Роль */}
          <div>
            <div className="flex gap-3">
              {[
                { val: "driver",    label: "🚗 Я — водій" },
                { val: "passenger", label: "💺 Я — пасажир" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, role: val })}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.role === val
                    ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                    : { background: "white",   borderColor: "#E5E7EB",  color: "#374151" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Тип маршруту */}
            <div className="flex gap-3 mt-3">
              {([
                { val: "suburban",  label: "🏘 Приміська" },
                { val: "intercity", label: "🛣 Міжміська" },
              ] as const).map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, tripScope: val })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.tripScope === val
                    ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                    : { background: "white",   borderColor: "#E5E7EB",  color: "#374151" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Звідки / Куди */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                Звідки
              </label>
              <PlaceAutocomplete
                value={form.from}
                onChange={(v, place) => setForm({ ...form, from: v,
                  fromLat: place?.lat ?? null, fromLng: place?.lng ?? null })}
                placeholder="Ірпінь"
                dotColor="blue"
                inputClassName="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                Куди
              </label>
              <PlaceAutocomplete
                value={form.to}
                onChange={(v, place) => setForm({ ...form, to: v,
                  toLat: place?.lat ?? null, toLng: place?.lng ?? null })}
                placeholder="Київ"
                dotColor="red"
                inputClassName="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
              />
            </div>
          </div>


          {/* Карта для вибору точок */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#374151] uppercase tracking-wide">
                Або постав точки на карті
              </label>
              <span className="text-xs text-[#9CA3AF]">для внутрішньоміських маршрутів</span>
            </div>
            <Suspense fallback={
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center text-xs text-[#9CA3AF]" style={{ height: 100 }}>
                Завантаження карти...
              </div>
            }>
              <MapPicker
                fromLat={form.fromLat}
                fromLng={form.fromLng}
                toLat={form.toLat}
                toLng={form.toLng}
                fromName={form.from}
                toName={form.to}
                onFromChange={(name, lat, lng) => setForm(f => ({ ...f, from: name, fromLat: lat, fromLng: lng }))}
                onToChange={(name, lat, lng) => setForm(f => ({ ...f, to: name, toLat: lat, toLng: lng }))}
              />
            </Suspense>
          </div>

          {/* Проміжні зупинки */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#374151] uppercase tracking-wide">
                Проміжні зупинки
              </label>
              <button
                type="button"
                onClick={() => setForm({ ...form, waypoints: [...form.waypoints, { name: "", lat: null, lng: null }] })}
                className="text-xs font-semibold px-3 py-1 rounded-full border transition-all"
                style={{ background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }}
              >
                + Додати зупинку
              </button>
            </div>
            {form.waypoints.length === 0 && (
              <p className="text-xs text-[#9CA3AF]">
                Необов&apos;язково — додай міста або райони по дорозі
              </p>
            )}
            {form.waypoints.map((wp, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <PlaceAutocomplete
                    value={wp.name}
                    onChange={(v, place) => {
                      const updated = [...form.waypoints]
                      updated[idx] = { name: v, lat: place?.lat ?? null, lng: place?.lng ?? null }
                      setForm({ ...form, waypoints: updated })
                    }}
                    placeholder={`Зупинка ${idx + 1}`}
                    dotColor="blue"
                    inputClassName="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, waypoints: form.waypoints.filter((_, i) => i !== idx) })}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#E53935] hover:bg-[#FDECEA] transition-all"
                  aria-label="Видалити зупинку"
                >
                  &#215;
                </button>
              </div>
            ))}
          </div>

          {/* Опис */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Опис маршруту
            </label>
            <textarea
              required
              rows={6}
              placeholder={PLACEHOLDER_EXAMPLE}
              value={form.aiText}
              onChange={(e) => setForm({ ...form, aiText: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9] resize-none"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Вкажи час, дні, зупинки, кількість місць — все що важливо попутнику
            </p>
          </div>

          {/* Туди-назад */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
                style={form.isRoundTrip
                  ? { background: "#5B8FD9", borderColor: "#5B8FD9" }
                  : { background: "white", borderColor: "#D1D5DB" }
                }
              >
                {form.isRoundTrip && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.isRoundTrip}
                onChange={(e) => setForm({ ...form, isRoundTrip: e.target.checked })}
              />
              <span className="text-sm text-[#374151]">Поїздка туди-назад (↩ обидва напрямки)</span>
            </label>

            {form.isRoundTrip && (
              <div className="mt-3 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[#065F46] uppercase tracking-wide">↩ Зворотній маршрут</p>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-[#6B7280] shrink-0">Час виїзду назад:</label>
                  <input
                    type="time"
                    value={form.returnTime}
                    onChange={(e) => setForm({ ...form, returnTime: e.target.value })}
                    className="flex-1 bg-white border border-[#D1FAE5] rounded-xl px-4 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-[#10B981]"
                  />
                </div>
                {form.tripType === "once" && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#6B7280] shrink-0">Дата повернення:</label>
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                      className="flex-1 bg-white border border-[#D1FAE5] rounded-xl px-4 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-[#10B981]"
                    />
                  </div>
                )}
                <p className="text-xs text-[#6B7280]">
                  Зворотній маршрут: <span className="font-medium text-[#111827]">{form.to || "Куди"} → {form.from || "Звідки"}</span>
                </p>
              </div>
            )}
          </div>

          {/* Помилка */}
          {error && (
            <div className="bg-[#FDECEA] border border-[#FECACA] rounded-xl p-3 text-sm text-[#B91C1C]">
              ⚠️ {error}
            </div>
          )}


          {/* Коли їдеш */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Коли їдеш?
            </label>
            {/* Тип поїздки */}
            <div className="flex gap-2 mb-3">
              {([["once", "Конкретна дата"], ["regular", "Регулярно"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, tripType: val })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.tripType === val
                    ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                    : { background: "white", borderColor: "#E5E7EB", color: "#374151" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Одноразова — дата */}
            {form.tripType === "once" && (
              <input
                type="date"
                value={form.departureDate}
                onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] outline-none transition-colors focus:border-[#5B8FD9] mb-3"
              />
            )}
            {/* Регулярна — дні тижня */}
            {form.tripType === "regular" && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {(["mon","tue","wed","thu","fri","sat","sun"] as const).map((d, i) => {
                  const labels = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"]
                  const active = form.schedule.includes(d)
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        schedule: active
                          ? form.schedule.filter((x) => x !== d)
                          : [...form.schedule, d],
                      })}
                      className="w-9 h-9 rounded-full text-xs font-bold border-2 transition-all"
                      style={active
                        ? { background: "#5B8FD9", borderColor: "#5B8FD9", color: "white" }
                        : { background: "white", borderColor: "#E5E7EB", color: "#374151" }
                      }
                    >
                      {labels[i]}
                    </button>
                  )
                })}
              </div>
            )}
            {/* Час відправлення */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-[#6B7280] shrink-0">Час відправлення:</label>
              <input
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-[#5B8FD9]"
              />
            </div>
          </div>

          {/* Кількість місць */}
          <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                {form.role === "driver" ? "Кількість місць" : "Кількість пасажирів"}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, seats: Math.max(1, form.seats - 1) })}
                  className="w-10 h-10 rounded-full border-2 text-lg font-bold transition-all"
                  style={{ borderColor: "#E5E7EB", color: "#374151", background: "white" }}
                >
                  −
                </button>
                <span className="text-xl font-extrabold text-[#111827] w-6 text-center">
                  {form.seats}
                </span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, seats: Math.min(8, form.seats + 1) })}
                  className="w-10 h-10 rounded-full border-2 text-lg font-bold transition-all"
                  style={{ borderColor: "#5B8FD9", color: "#3A6BBF", background: "#EBF2FC" }}
                >
                  +
                </button>
                <span className="text-xs text-[#9CA3AF]">{form.role === "driver" ? "вільних місць у машині" : "людей їде разом"}</span>
              </div>
          </div>

          {/* Засоби зв'язку */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Засоби зв&apos;язку
            </label>
            <input
              type="text"
              placeholder="Тел., Viber, Instagram, інший мессенджер"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Напр.: +380 50 123 45 67 · @viber_nick · instagram.com/user
            </p>
          </div>

          {/* Спільнота */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Спільнота <span className="text-[#9CA3AF] normal-case font-normal">(необов&apos;язково)</span>
            </label>
            <input
              type="text"
              placeholder="Напр.: ЖК Новий Автограф, КПІ, Samsung Ukraine, Оболонь"
              value={form.community}
              onChange={(e) => setForm({ ...form, community: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              ЖК, університет, компанія або район — щоб сусіди тебе знайшли
            </p>
          </div>

          {/* Кнопка */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "#5B8FD9", boxShadow: "0 4px 16px rgba(91,143,217,0.4)" }}
          >
            {loading ? "Публікую..." : "Опублікувати оголошення"}
          </button>

          <p className="text-xs text-center text-[#9CA3AF]">
            Публікуючи, ти погоджуєшся з{" "}
            <a href="#" className="underline" style={{ color: "#5B8FD9" }}>правилами сайту</a>
          </p>
        </form>
      </div>
    </div>
  )
}
