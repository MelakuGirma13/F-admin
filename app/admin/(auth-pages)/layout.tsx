import type React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen">
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/40">{children}</main>
      </div>
    </div>
  )
}
