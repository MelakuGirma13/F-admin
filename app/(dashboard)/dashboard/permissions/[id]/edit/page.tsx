import { prisma } from "@/lib/prisma"
import { PermissionForm } from "@/components/permission-form"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { notFound, redirect } from "next/navigation"

export default async function EditPermissionPage({ params }: { params: { id: string } }) {
  const session = await auth()

  // Check if user has permission to update permissions
  if (!session || !hasPermission(session.user, "permissions:update")) {
    redirect("/unauthorized")
  }

  const permissionId = params.id

  // Fetch permission
  const permission = await prisma.permission.findUnique({
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
