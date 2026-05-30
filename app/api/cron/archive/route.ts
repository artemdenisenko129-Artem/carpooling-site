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

  // Тільки одноразові поїздки з минулою датою — регулярні не чіпаємо ніколи
  const onceResult = await db.collection("announcements").updateMany(
    {
      isActive: true,
      tripType: "once",
      departureDate: { $lt: today.toISOString().slice(0, 10) },
    },
    { $set: { isActive: false, archivedAt: new Date(), archiveReason: "date_passed" } }
  )

  console.log(`Cron archive: ${onceResult.modifiedCount} one-time trips archived`)
  return NextResponse.json({ ok: true, archived: onceResult.modifiedCount })
}
