
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { notFound, redirect } from "next/navigation"
import db from "@/lib/db"
import { PermissionForm } from "@/components/auth/permission-form"

export default async function EditPermissionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  // Check if user has permission to update permissions
  if (!session || !hasPermission(session.user, "permissions:update")) {
    redirect("/unauthorized")
  }

  const {id: permissionId }= await params

  // Fetch permission
  const permission = await db.permission.findUnique({
    where: { id: permissionId },
  })

  if (!permission) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Permission</h1>
        <p className="text-muted-foreground">Update permission details</p>
      </div>

      <PermissionForm
        permission={{
          id: permission.id,
          name: permission.name,
          description: permission.description || "",
        }}
      />
    </div>
  )
}
