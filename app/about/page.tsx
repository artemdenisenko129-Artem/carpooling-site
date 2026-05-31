import { Metadata } from "next"
import Link from "next/link"
import { SITE, ROUTES, CITIES } from "../../lib/seo-config"

export const metadata: Metadata = {
  title: `Про сервіс — ${SITE.name} | Приміські попутники Київ`,
  description: "ПопуткиUA — безкоштовний сервіс пошуку попутників для щоденних приміських поїздок Київ та передмістя. Бровари, Ірпінь, Буча, Вишневе, Боярка та інші міста.",
  alternates: { canonical: `${SITE.domain}/about` },
}

export default function AboutPage() {
  const toKyiv = ROUTES.filter(r => r.to === "Київ")

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <header className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-base font-extrabold text-[#111827]">
            Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
          </span>
        </Link>
        <Link href="/" className="text-sm text-[#6B7280] hover:text-[#5B8FD9] no-underline">← На головну</Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
        <h1 className="text-2xl font-extrabold text-[#111827] mb-2">Про ПопуткиUA</h1>
        <p className="text-sm text-[#9CA3AF] mb-8">Безкоштовний сервіс щоденних попутних поїздок</p>

        {/* Що це */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 mb-6">
          <h2 className="text-base font-bold text-[#111827] mb-3">Що таке ПопуткиUA</h2>
          <p className="text-sm text-[#374151] leading-relaxed mb-4">
            ПопуткиUA — безкоштовна платформа для пошуку попутників на щоденних приміських маршрутах.
            Головний фокус — поїздки <strong>дім → робота → дім</strong> між передмістями Києва і столицею.
            Водії та пасажири домовляються напряму в Telegram і ділять витрати на дорогу.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🆓", title: "Безкоштовно", text: "Для водіїв і пасажирів" },
              { icon: "💬", title: "Напряму", text: "Telegram без посередників" },
              { icon: "🔄", title: "Щодня", text: "Регулярні маршрути — основний фокус" },
              { icon: "🗺", title: "Зручно", text: "Карта, фільтри, пошук по маршруту" },
            ].map(f => (
              <div key={f.title} className="bg-[#F3F4F6] rounded-xl p-3">
                <div className="text-lg mb-1">{f.icon}</div>
                <div className="text-xs font-bold text-[#111827]">{f.title}</div>
                <div className="text-xs text-[#6B7280]">{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Як це працює */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 mb-6">
          <h2 className="text-base font-bold text-[#111827] mb-3">Як це працює</h2>
          <ol className="flex flex-col gap-3 text-sm text-[#374151]">
            <li className="flex gap-3">
              <span className="font-bold text-[#5B8FD9] shrink-0">1.</span>
              <span><strong>Шукай</strong> — введи своє місто або маршрут у пошуку. Фільтруй за роллю (водій/пасажир) і типом поїздки.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#5B8FD9] shrink-0">2.</span>
              <span><strong>Пиши</strong> — натисни на оголошення і напиши людині напряму в Telegram. Домовтесь про деталі.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#5B8FD9] shrink-0">3.</span>
              <span><strong>Їдь</strong> — або розмісти власне оголошення. Воно одразу з'явиться на сайті і в Telegram-каналі @poputky_ua.</span>
            </li>
          </ol>
        </div>

        {/* Telegram-канал */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(135deg, #EBF2FC, #F0F7FF)", border: "1.5px solid #C7DCF7" }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">✈️</span>
            <div>
              <h2 className="text-base font-bold text-[#111827] mb-1">Telegram-канал @poputky_ua</h2>
              <p className="text-sm text-[#374151] leading-relaxed mb-3">
                Кожне нове оголошення автоматично публікується в каналі. Підпишись — і отримуй нові попутки одразу в Telegram, не заходячи на сайт.
              </p>
              <a href="https://t.me/poputky_ua" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white no-underline"
                style={{ background: "#229ED9" }}>
                ✈️ Підписатися на канал
              </a>
            </div>
          </div>
        </div>

        {/* Популярні маршрути */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 mb-6">
          <h2 className="text-base font-bold text-[#111827] mb-3">Популярні маршрути → Київ</h2>
          <div className="flex flex-col gap-2">
            {toKyiv.map(r => (
              <Link key={r.slug} href={`/route/${r.slug}`}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F3F4F6] no-underline hover:bg-[#EBF2FC] transition-colors">
                <span className="text-sm font-semibold text-[#374151]">{r.from} → {r.to}</span>
                <span className="text-xs text-[#9CA3AF]">{r.distanceKm} км · {r.timeMin}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Міста */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 mb-6">
          <h2 className="text-base font-bold text-[#111827] mb-3">Міста поруч з Києвом</h2>
          <div className="flex flex-wrap gap-2">
            {CITIES.map(c => (
              <Link key={c.slug} href={`/city/${c.slug}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#374151] no-underline hover:bg-[#EBF2FC] hover:text-[#3A6BBF] transition-colors">
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/"
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white no-underline mb-3 transition-opacity hover:opacity-90"
            style={{ background: "#5B8FD9" }}>
            🔍 Шукати попутника
          </Link>
          <br />
          <Link href="/new"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold no-underline transition-colors border mt-2"
            style={{ borderColor: "#5B8FD9", color: "#3A6BBF" }}>
            + Розмістити оголошення
          </Link>
          <p className="mt-4 text-xs text-[#9CA3AF]">
            <Link href="/rules" className="text-[#9CA3AF] hover:text-[#5B8FD9] no-underline">Правила сервісу</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
