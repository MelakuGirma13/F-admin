import { PermissionForm } from "@/components/permission-form"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function NewPermissionPage() {
  const session = await auth()

  // Check if user has permission to create permissions
  if (!session || !hasPermission(session.user, "permissions:create")) {
    redirect("/unauthorized")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Permission</h1>
        <p className="text-muted-foreground">Add a new permission to the system</p>
      </div>

      <PermissionForm />
    </div>
  )
}
