import { NextResponse } from "next/server"
import clientPromise from "../../../lib/db"
import { getSession } from "../../../lib/session"

const BOT_TOKEN = process.env.BOT_TOKEN
const CHANNEL_USERNAME = process.env.NEXT_PUBLIC_CHANNEL_USERNAME || "poputky_ua"
const CHANNEL_ID = process.env.CHANNEL_ID || "@" + CHANNEL_USERNAME

const DAY_LABELS: Record<string, string> = { mon:"Пн", tue:"Вт", wed:"Ср", thu:"Чт", fri:"Пт", sat:"Сб", sun:"Нд" }
const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"]

async function postToChannel(doc: any, announcementId?: string): Promise<number | null> {
  if (!BOT_TOKEN || !CHANNEL_ID) return null

  const role = doc.role === "driver" ? "🚗 <b>Водій</b>" : "💺 <b>Пасажир</b>"

  // Маршрут з проміжними зупинками
  const waypts = Array.isArray(doc.waypoints) && doc.waypoints.length > 0
    ? doc.waypoints.map((w: any) => w.name).join(" → ")
    : ""
  const route = [doc.from, waypts, doc.to].filter(Boolean).join(" → ")

  // Коли їде
  let when = ""
  if (doc.tripType === "once" && doc.departureDate) {
    const d = new Date(doc.departureDate)
    when = "📅 " + d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })
  } else if (Array.isArray(doc.schedule) && doc.schedule.length > 0) {
    const days = DAY_ORDER.filter(d => doc.schedule.includes(d)).map(d => DAY_LABELS[d]).join(", ")
    when = "🔄 " + days
  }

  // Час
  let timing = ""
  if (doc.departureTime) timing += "🕐 Виїзд: " + doc.departureTime
  if (doc.isRoundTrip && doc.returnTime) timing += (timing ? "  " : "") + "↩ Назад: " + doc.returnTime

  // Деталі
  const details: string[] = []
  if (doc.seats && doc.seats > 0) {
    const word = doc.seats === 1 ? "місце" : doc.seats < 5 ? "місця" : "місць"
    details.push("👤 " + doc.seats + " " + word)
  }

  // Контакт
  const contactLines: string[] = []
  if (doc.telegramUsername) contactLines.push("📩 @" + doc.telegramUsername)
  if (doc.phone) contactLines.push("📞 " + doc.phone)
  const contact = contactLines.join("  ·  ")

  // Опис
  const description = doc.aiText ? "\n\n" + doc.aiText : ""

  const lines = [
    role,
    "📍 " + route,
    when,
    timing,
    details.length > 0 ? details.join("  ·  ") : "",
    description,
    "",
    contact,
  ].filter(l => l !== null && l !== undefined && l !== "")

  const text = lines.join("\n")

  try {
    const res = await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: "HTML" }),
    })
    const data = await res.json()
    if (data.ok && data.result?.message_id) return data.result.message_id
    console.error("Telegram API error:", data)
    return null
  } catch (e) {
    console.error("Failed to post to channel:", e)
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const page = Math.max(0, parseInt(searchParams.get("page") || "0"))
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "20")))

    const client = await clientPromise
    const db = client.db("carpooling")
    const today = new Date().toISOString().slice(0, 10)

    const activeFilter = {
      isActive: true,
      $or: [
        { tripType: "regular" },
        { tripType: "once", departureDate: { $gte: today } },
        { tripType: { $exists: false } },
        { departureDate: { $exists: false } },
      ],
    }

    function npMatch(np: string) {
      const r = { $regex: np.trim(), $options: "i" }
      return {
        $or: [
          { searchFrom: r },
          { searchTo: r },
          { waypoints: { $elemMatch: { name: r } } },
        ]
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = { ...activeFilter }
    if (from.trim() && to.trim()) {
      query.$and = [npMatch(from), npMatch(to)]
    } else if (from.trim()) {
      Object.assign(query, npMatch(from))
    } else if (to.trim()) {
      Object.assign(query, npMatch(to))
    }

    const items = await db.collection("announcements")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit + 1)
      .toArray()

    const hasMore = items.length > limit
    const result = items.slice(0, limit)

    return NextResponse.json({ items: JSON.parse(JSON.stringify(result)), hasMore })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telegramUsername, role, from, to, aiText, isRoundTrip,
            fromLat, fromLng, toLat, toLng, waypoints,
            tripType, departureDate, schedule, departureTime,
            phone, community, seats, returnTime, returnDate } = body

    if (!role || !from || !to || !aiText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("carpooling")

    // Антиспам: перевірка ліміту і rate limit
    const session = await getSession()
    if (session?.id) {
      // Ліміт: не більше 5 активних оголошень
      const activeCount = await db.collection("announcements").countDocuments({
        authorId: session.id,
        isActive: true,
      })
      if (activeCount >= 5) {
        return NextResponse.json({ error: "Ліміт: не більше 5 активних оголошень. Деактивуйте старі в кабінеті." }, { status: 429 })
      }

      // Rate limit: не частіше 1 оголошення на 10 хвилин
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const recentCount = await db.collection("announcements").countDocuments({
        authorId: session.id,
        createdAt: { $gte: tenMinutesAgo },
      })
      if (recentCount >= 1) {
        return NextResponse.json({ error: "Зачекайте 10 хвилин перед наступним оголошенням." }, { status: 429 })
      }
    }

    const authorName = session?.name || null
    const authorId = session?.id || null

    // Security: if logged in via Telegram, always use the verified session username.
    // If logged in via Google, allow the manually entered username (for contact purposes).
    const resolvedTelegramUsername = session?.telegramUsername
      ? session.telegramUsername.replace("@", "")
      : (telegramUsername ? String(telegramUsername).replace("@", "") : "")

    const doc: any = {
      telegramUsername: resolvedTelegramUsername,
      ...(authorName ? { authorName } : {}),
      ...(authorId ? { authorId } : {}),
      role,
      from: String(from),
      to: String(to),
      aiText,
      searchFrom: String(from).toLowerCase(),
      searchTo: String(to).toLowerCase(),
      isRoundTrip: Boolean(isRoundTrip),
      isActive: true,
      createdAt: new Date(),
      ...(fromLat != null && fromLng != null ? { fromLat: Number(fromLat), fromLng: Number(fromLng) } : {}),
      ...(toLat   != null && toLng   != null ? { toLat:   Number(toLat),   toLng:   Number(toLng)   } : {}),
      ...(Array.isArray(waypoints) && waypoints.length > 0
        ? { waypoints: waypoints.filter((w: any) => w.lat != null && w.lng != null)
              .map((w: any) => ({ name: String(w.name || ""), lat: Number(w.lat), lng: Number(w.lng) })) }
        : {}),
      tripType: tripType === "once" ? "once" : "regular",
      ...(departureDate ? { departureDate: String(departureDate) } : {}),
      ...(Array.isArray(schedule) && schedule.length > 0 ? { schedule } : {}),
      ...(departureTime ? { departureTime: String(departureTime) } : {}),
      ...(phone?.trim() ? { phone: String(phone).trim() } : {}),
      ...(community?.trim() ? { community: String(community).trim() } : {}),
      ...(seats ? { seats: Math.min(8, Math.max(1, Number(seats))) } : {}),
      ...(returnTime?.trim() ? { returnTime: String(returnTime).trim() } : {}),
      ...(returnDate?.trim() ? { returnDate: String(returnDate).trim() } : {}),
    }

    const result = await db.collection("announcements").insertOne(doc)

    const channelMessageId = await postToChannel(doc, result.insertedId.toString())

    if (channelMessageId) {
      await db.collection("announcements").updateOne(
        { _id: result.insertedId },
        { $set: { channelMessageId, channelUsername: CHANNEL_USERNAME } }
      )
    }

    return NextResponse.json({ ok: true, id: result.insertedId, channelMessageId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}