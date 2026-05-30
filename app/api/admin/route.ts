import { NextResponse } from "next/server"
import { getSession } from "../../../lib/session"
import clientPromise from "../../../lib/db"

const ADMIN_EMAIL = "artemdenisenko129@gmail.com"

async function checkAdmin() {
  const session = await getSession()
  if (!session) return null
  if (session.email !== ADMIN_EMAIL) return null
  return session
}

export async function GET(request: Request) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get("tab") || "stats"
  const page = parseInt(searchParams.get("page") || "1")
  const limit = 30
  const skip = (page - 1) * limit

  const client = await clientPromise
  const db = client.db("carpooling")

  if (tab === "stats") {
    const now = new Date()
    const day = new Date(now); day.setDate(day.getDate() - 1)
    const week = new Date(now); week.setDate(week.getDate() - 7)
    const month = new Date(now); month.setDate(month.getDate() - 30)

    const [total, active, archived, today, thisWeek, thisMonth, totalUsers, consentCount] = await Promise.all([
      db.collection("announcements").countDocuments({}),
      db.collection("announcements").countDocuments({ isActive: true }),
      db.collection("announcements").countDocuments({ isActive: false }),
      db.collection("announcements").countDocuments({ createdAt: { $gte: day } }),
      db.collection("announcements").countDocuments({ createdAt: { $gte: week } }),
      db.collection("announcements").countDocuments({ createdAt: { $gte: month } }),
      db.collection("profiles").countDocuments({}),
      db.collection("consents").countDocuments({}),
    ])

    return NextResponse.json({ total, active, archived, today, thisWeek, thisMonth, totalUsers, consentCount })
  }

  if (tab === "announcements") {
    const filter = searchParams.get("filter") || "active"
    const sortBy = searchParams.get("sort") || "date_desc"
    const sortOrder: Record<string, Record<string, number>> = {
      date_desc: { createdAt: -1 },
      date_asc: { createdAt: 1 },
      views: { views: -1, createdAt: -1 },
    }
    const query = filter === "all" ? {} : filter === "archived" ? { isActive: false } : { isActive: true }
    const [items, count] = await Promise.all([
      db.collection("announcements").find(query).sort(sortOrder[sortBy] ?? { createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("announcements").countDocuments(query),
    ])
    return NextResponse.json({ items: JSON.parse(JSON.stringify(items)), count, page, pages: Math.ceil(count / limit) })
  }

  if (tab === "users") {
    const [profiles, consents] = await Promise.all([
      db.collection("profiles").find({}).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("consents").find({}).toArray(),
    ])
    const consentMap = Object.fromEntries(consents.map((c: any) => [c.userId, c.firstConsentAt]))
    const items = profiles.map((p: any) => ({ ...p, consentAt: consentMap[p.userId] || null }))
    const count = await db.collection("profiles").countDocuments({})
    return NextResponse.json({ items: JSON.parse(JSON.stringify(items)), count, page, pages: Math.ceil(count / limit) })
  }

  return NextResponse.json({ error: "Unknown tab" }, { status: 400 })
}

export async function DELETE(request: Request) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const { id, action, ids } = body
  const client = await clientPromise
  const db = client.db("carpooling")
  const { ObjectId } = await import("mongodb")

  if (action === "deactivate") {
    await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, archivedAt: new Date(), archiveReason: "admin" } }
    )
    return NextResponse.json({ ok: true })
  }

  if (action === "restore") {
    await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: true }, $unset: { archivedAt: "", archiveReason: "" } }
    )
    return NextResponse.json({ ok: true })
  }

  // Bulk деактивація
  if (action === "bulk_deactivate") {
    const allIds = ids?.length ? ids : [id]
    await db.collection("announcements").updateMany(
      { _id: { $in: allIds.map((i: string) => new ObjectId(i)) } },
      { $set: { isActive: false, archivedAt: new Date(), archiveReason: "admin_bulk" } }
    )
    return NextResponse.json({ ok: true, count: allIds.length })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
