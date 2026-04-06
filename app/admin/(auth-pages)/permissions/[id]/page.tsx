
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import Link from "next/link"
import { ArrowLeft, Edit, Shield } from "lucide-react"
import db from "@/lib/db"
import { DeleteConfirmation } from "@/components/auth/delete-confirmation"

export default async function PermissionDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  // Check if user has permission to view permissions
  if (!session || !hasPermission(session.user, "permissions:read")) {
    redirect("/unauthorized")
  }

  const permissionId = params.id

  // Fetch permission with its roles
  const permission = await db.permission.findUnique({
    where: { id: permissionId },
    include: {
      rolePermissions: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!permission) {
    notFound()
  }

  // Check if current user has permission to edit/delete
  const canEdit = hasPermission(session.user, "permissions:update")
  const canDelete = hasPermission(session.user, "permissions:delete")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/permissions">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{permission.name}</h1>
        </div>
        <div className="flex space-x-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/dashboard/permissions/${permission.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {canDelete && <DeleteConfirmation id={permission.id} name={permission.name} type="permission" />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Permission Information</CardTitle>
            <CardDescription>Basic permission details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{permission.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p>{permission.description || "No description provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{new Date(permission.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p>{new Date(permission.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Roles</CardTitle>
            <CardDescription>Roles that have this permission</CardDescription>
          </CardHeader>
          <CardContent>
            {permission.rolePermissions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {permission.rolePermissions.map((rolePermission) => (
                  <Link
                    key={rolePermission.roleId}
                    href={`/dashboard/roles/${rolePermission.roleId}`}
                    className="flex items-center space-x-3 border rounded-md p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-shrink-0 bg-muted rounded-full p-2">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{rolePermission.role.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {rolePermission.role.description || "No description"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This permission is not assigned to any roles yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
