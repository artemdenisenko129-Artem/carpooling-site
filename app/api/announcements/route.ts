import { NextResponse } from "next/server"
import clientPromise from "../../../lib/db"

const BOT_TOKEN = process.env.BOT_TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID
const CHANNEL_USERNAME = process.env.NEXT_PUBLIC_CHANNEL_USERNAME || "poputky_ua"

async function postToChannel(doc: any): Promise<number | null> {
  if (!BOT_TOKEN || !CHANNEL_ID) {
    console.error("BOT_TOKEN or CHANNEL_ID missing in .env.local")
    return null
  }
  const roleText = doc.role === "driver" ? "🚗 Водій" : "💺 Пасажир"
  const route = (doc.from || "?") + " ⮕ " + (doc.to || "?")
  const username = doc.telegramUsername ? "@" + doc.telegramUsername : ""
  const text = roleText + "\n📍 " + route + "\n\n" + doc.aiText + (username ? "\n\n📩 " + username : "")

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

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("carpooling")
    const items = await db.collection("announcements").find({ isActive: true }).sort({ createdAt: -1 }).limit(20).toArray()
    return NextResponse.json(items)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telegramUsername, role, from, to, aiText, isRoundTrip,
            fromLat, fromLng, toLat, toLng } = body

    if (!telegramUsername || !role || !from || !to || !aiText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("carpooling")

    const doc: any = {
      telegramUsername: String(telegramUsername).replace("@", ""),
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
    }

    const result = await db.collection("announcements").insertOne(doc)

    const channelMessageId = await postToChannel(doc)

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
