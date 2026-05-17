import { NextResponse } from "next/server"
import clientPromise from "../../../lib/db"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("carpooling")
    const items = await db
      .collection("announcements")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()
    return NextResponse.json(items)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telegramUsername, role, from, to, aiText, isRoundTrip } = body

    if (!telegramUsername || !role || !from || !to || !aiText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("carpooling")

    const doc = {
      telegramUsername: String(telegramUsername).replace("@", ""),
      role,
      aiText,
      searchFrom: String(from).toLowerCase(),
      searchTo: String(to).toLowerCase(),
      isRoundTrip: Boolean(isRoundTrip),
      isActive: true,
      createdAt: new Date(),
    }

    const result = await db.collection("announcements").insertOne(doc)
    return NextResponse.json({ ok: true, id: result.insertedId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
