
import { auth } from "@/auth"
import { RoleForm } from "@/components/auth/role-form"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"
import { redirect } from "next/navigation"

export default async function NewRolePage() {
  const session = await auth()

  // Check if user has permission to create roles
  if (!session || !hasPermission(session.user, "roles:create")) {
    redirect("/unauthorized")
  }

  // Fetch all permissions for the form
  const rawPermissions = await db.permission.findMany({
    orderBy: {
      name: "asc",
    },
  })

  const permissions = rawPermissions.map((p) => ({
  ...p,
  description: p.description ?? undefined,
}))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Role</h1>
        <p className="text-muted-foreground">Add a new role to the system</p>
      </div>

      <RoleForm permissions={permissions} />
    </div>
  )
}
