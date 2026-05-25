import { auth } from "../../lib/auth"
import { redirect } from "next/navigation"

export default async function NewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?callbackUrl=/new")
  }

  return <>{children}</>
}
