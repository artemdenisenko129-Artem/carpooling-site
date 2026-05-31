import { NextResponse } from "next/server"
import clientPromise from "../../../lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim().toLowerCase() ?? ""

  if (q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const client = await clientPromise
    const db = client.db("carpooling")

    const qEsc = escapeRegex(q)
    // Пошук за назвою (prefix) або aliases
    const prefixQuery = {
      $or: [
        { nameLower: { $regex: "^" + qEsc, $options: "i" } },
        { aliases: { $regex: "^" + qEsc, $options: "i" } },
      ]
    }
    const results = await db
      .collection("places")
      .find(prefixQuery)
      .sort({ pop: -1 })
      .limit(8)
      .project({ _id: 0, name: 1, region: 1, lat: 1, lng: 1 })
      .toArray()

    // Якщо мало — шукаємо входження
    if (results.length < 4) {
      const anywhereQuery = {
        $or: [
          { nameLower: { $regex: qEsc, $options: "i" } },
          { aliases: { $regex: qEsc, $options: "i" } },
        ]
      }
      const extra = await db
        .collection("places")
        .find(anywhereQuery)
        .sort({ pop: -1 })
        .limit(8)
        .project({ _id: 0, name: 1, region: 1, lat: 1, lng: 1 })
        .toArray()

      const seen = new Set(results.map((r: any) => r.name))
      for (const item of extra) {
        if (!seen.has(item.name)) {
          results.push(item)
          seen.add(item.name)
        }
      }
    }

    return NextResponse.json(results.slice(0, 8))
  } catch (err) {
    console.error("places API error:", err)
    return NextResponse.json([], { status: 500 })
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
