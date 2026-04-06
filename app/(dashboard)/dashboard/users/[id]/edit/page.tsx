import { prisma } from "@/lib/prisma"
import { UserForm } from "@/components/user-form"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { notFound, redirect } from "next/navigation"

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await auth()

  // Check if user has permission to update users
  if (!session || !hasPermission(session.user, "users:update")) {
    redirect("/unauthorized")
  }

  const userId = params.id

  // Fetch user with their roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
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
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
        <p className="text-muted-foreground">Update user information and role assignments</p>
      </div>

      <UserForm
        user={{
          id: user.id,
          name: user.name || "",
          email: user.email,
          roles: user.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
          })),
        }}
        roles={roles}
      />
    </div>
  )
}
