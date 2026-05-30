import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/session"
import clientPromise from "../../../../lib/db"
import { cookies } from "next/headers"

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const client = await clientPromise
  const db = client.db("carpooling")

  // Деактивуємо всі оголошення користувача
  await db.collection("announcements").updateMany(
    { authorId: session.id },
    { $set: { isActive: false } }
  )

  // Видаляємо профіль і згоди
  await db.collection("profiles").deleteOne({ userId: session.id })
  await db.collection("consents").deleteOne({ userId: session.id })

  // Видаляємо сесійну куку
  const cookieStore = await cookies()
  cookieStore.delete("session")

  return NextResponse.json({ ok: true })
}
