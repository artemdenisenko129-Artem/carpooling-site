import { NextResponse } from "next/server"
import clientPromise from "../../../../lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db("carpooling")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Разові — дата вже минула
  const onceResult = await db.collection("announcements").updateMany(
    {
      isActive: true,
      tripType: "once",
      departureDate: { $lt: today.toISOString().slice(0, 10) },
    },
    { $set: { isActive: false, archivedAt: new Date(), archiveReason: "date_passed" } }
  )

  // 2. Регулярні — через 90 днів після публікації
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const regularResult = await db.collection("announcements").updateMany(
    {
      isActive: true,
      $or: [{ tripType: "regular" }, { tripType: { $exists: false } }],
      createdAt: { $lt: ninetyDaysAgo },
    },
    { $set: { isActive: false, archivedAt: new Date(), archiveReason: "expired_90d" } }
  )

  const total = onceResult.modifiedCount + regularResult.modifiedCount
  console.log(`Cron archive: ${total} archived (once: ${onceResult.modifiedCount}, regular: ${regularResult.modifiedCount})`)

  return NextResponse.json({ ok: true, archived: total, once: onceResult.modifiedCount, regular: regularResult.modifiedCount })
}
