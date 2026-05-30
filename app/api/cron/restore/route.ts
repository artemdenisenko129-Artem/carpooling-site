import { NextResponse } from "next/server"
import clientPromise from "../../../../lib/db"

// Тимчасовий endpoint для відновлення нещодавно заархівованих оголошень
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const client = await clientPromise
  const db = client.db("carpooling")
  // Відновити все що заархівував cron за останній день
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const result = await db.collection("announcements").updateMany(
    { isActive: false, archivedAt: { $gte: oneDayAgo } },
    { $set: { isActive: true }, $unset: { archivedAt: "", archiveReason: "" } }
  )
  return NextResponse.json({ ok: true, restored: result.modifiedCount })
}
