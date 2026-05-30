import { NextResponse } from "next/server"
import { getSession } from "../../../lib/session"
import clientPromise from "../../../lib/db"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { version } = await request.json()

  const client = await clientPromise
  const db = client.db("carpooling")

  await db.collection("consents").updateOne(
    { userId: session.id },
    {
      $set: {
        userId: session.id,
        userName: session.name,
        version: version || "1.0",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        firstConsentAt: new Date(),
      }
    },
    { upsert: true }
  )

  return NextResponse.json({ ok: true })
}
