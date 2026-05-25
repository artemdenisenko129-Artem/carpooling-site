import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "../../../../lib/db"
import { getSession } from "../../../../lib/session"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 })
    }

    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Невірний ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("carpooling")

    const announcement = await db.collection("announcements").findOne({
      _id: new ObjectId(id),
    })

    if (!announcement) {
      return NextResponse.json({ error: "Не знайдено" }, { status: 404 })
    }

    if (announcement.authorId !== session.id) {
      return NextResponse.json({ error: "Немає прав" }, { status: 403 })
    }

    await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, deletedAt: new Date() } }
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
