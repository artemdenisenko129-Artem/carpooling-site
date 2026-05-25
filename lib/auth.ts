import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import crypto from "crypto"

export function verifyTelegramAuth(data: Record<string, string>): boolean {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) return false

  const { hash, ...rest } = data
  if (!hash) return false

  const authDate = parseInt(rest.auth_date || "0", 10)
  if (Date.now() / 1000 - authDate > 86400) return false

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n")

  const secretKey = crypto.createHash("sha256").update(botToken).digest()
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex")

  return expectedHash === hash
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id:         { type: "text" },
        first_name: { type: "text" },
        last_name:  { type: "text" },
        username:   { type: "text" },
        photo_url:  { type: "text" },
        auth_date:  { type: "text" },
        hash:       { type: "text" },
      },
      async authorize(credentials) {
        const creds = credentials as Record<string, string>
        if (!verifyTelegramAuth(creds)) return null

        const name = [creds.first_name, creds.last_name].filter(Boolean).join(" ")

        return {
          id: creds.id,
          name,
          email: `tg_${creds.id}@poputtky.ua`,
          image: creds.photo_url || null,
          telegramId: creds.id,
          telegramUsername: creds.username || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.telegramId       = (user as any).telegramId       ?? null
        token.telegramUsername = (user as any).telegramUsername ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).telegramId       = token.telegramId       ?? null
        ;(session.user as any).telegramUsername = token.telegramUsername ?? null
      }
      return session
    },
  },
})
