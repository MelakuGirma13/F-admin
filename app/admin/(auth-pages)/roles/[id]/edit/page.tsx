import { auth } from "@/auth"
import { RoleForm } from "@/components/auth/role-form"
import { hasPermission } from "@/lib/auth-utils"
import db from "@/lib/db"
import { notFound, redirect } from "next/navigation"

export default async function EditRolePage({ params }: { params: Promise<{ id: string } >}) {
  const session = await auth()

  // Check if user has permission to update roles
  if (!session || !hasPermission(session.user, "roles:update")) {
    redirect("/unauthorized")
  }

const { id: roleId } = await params

  // Fetch role with its permissions
  const role = await db.role.findUnique({
    where: { id: roleId },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  if (!role) {
    notFound()
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
        <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
        <p className="text-muted-foreground">Update role information and permission assignments</p>
      </div>

      <RoleForm
        role={{
          id: role.id,
          name: role.name,
          description: role.description || "",
          permissions: role.rolePermissions.map((rp) => ({
            id: rp.permission.id,
            name: rp.permission.name,
          })),
        }}
        permissions={permissions}
      />
    </div>
  )
}
