import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/session"
import clientPromise from "../../../../lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const client = await clientPromise
  const db = client.db("carpooling")
  const items = await db.collection("announcements")
    .find({ authorId: session.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
  return NextResponse.json(JSON.parse(JSON.stringify(items)))
}
