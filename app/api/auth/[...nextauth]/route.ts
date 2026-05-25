import { NextResponse } from "next/server"
// next-auth більше не використовується — авторизація через /api/auth/telegram
export async function GET()  { return NextResponse.json({ error: "Not found" }, { status: 404 }) }
export async function POST() { return NextResponse.json({ error: "Not found" }, { status: 404 }) }
