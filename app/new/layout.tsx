import { getSession } from "../../lib/session"
import { redirect } from "next/navigation"

export default async function NewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) {
    redirect("/login?callbackUrl=/new")
  }
  return <>{children}</>
}
