import { NextResponse } from "next/server"
// Цей маршрут більше не використовується
export async function GET() {
  return NextResponse.redirect(new URL("/login", "https://poputtky.ua"))
}
