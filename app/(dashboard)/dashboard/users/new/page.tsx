import { prisma } from "@/lib/prisma"
import { UserForm } from "@/components/user-form"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function NewUserPage() {
  const session = await auth()

  // Check if user has permission to create users
  if (!session || !hasPermission(session.user, "users:create")) {
    redirect("/unauthorized")
  }

  // Fetch all roles for the form
  const rawroles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  })

   const roles = rawroles.map((p) => ({
  ...p,
  description: p.description ?? undefined,
}))


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
        <p className="text-muted-foreground">Add a new user to the system</p>
      </div>

      <UserForm roles={roles} />
    </div>
  )
}
