import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "BOT_TOKEN not set" }, { status: 500 })
  }

  // Отримуємо числовий bot_id через getMe
  const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`)
  const tgData = await tgRes.json()
  if (!tgData.ok) {
    return NextResponse.json({ error: "Telegram API error" }, { status: 500 })
  }

  const botId = String(tgData.result.id)
  const url   = new URL(request.url)
  const next  = url.searchParams.get("next") || "/"

  const returnTo =
    url.origin + "/api/auth/telegram-callback?next=" + encodeURIComponent(next)

  // Будуємо стандартний Telegram OAuth URL (повний редирект, без попапу)
  const oauthUrl =
    "https://oauth.telegram.org/auth?" +
    new URLSearchParams({
      bot_id:         botId,
      origin:         url.origin,
      request_access: "write",
      return_to:      returnTo,
    }).toString()

  return NextResponse.redirect(oauthUrl)
}
