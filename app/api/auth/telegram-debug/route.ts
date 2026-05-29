import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  const hasBotToken = !!process.env.BOT_TOKEN
  return NextResponse.json({ params, hasBotToken, env: process.env.NODE_ENV })
}
