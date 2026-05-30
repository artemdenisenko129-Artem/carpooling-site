import { NextResponse } from "next/server"
import { getSession } from "../../../lib/session"
import clientPromise from "../../../lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const client = await clientPromise
  const db = client.db("carpooling")
  const profile = await db.collection("profiles").findOne({ userId: session.id })
  return NextResponse.json({
    name: session.name,
    telegramUsername: session.telegramUsername ?? null,
    image: session.image ?? null,
    phone: profile?.phone ?? "",
    community: profile?.community ?? "",
  })
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { phone, community } = await request.json()
  const client = await clientPromise
  const db = client.db("carpooling")
  await db.collection("profiles").updateOne(
    { userId: session.id },
    { $set: { userId: session.id, phone: phone ?? "", community: community ?? "", updatedAt: new Date() } },
    { upsert: true }
  )
  return NextResponse.json({ ok: true })
}
