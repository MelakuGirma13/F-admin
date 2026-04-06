import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  // Check if user has permission to view users
  if (!session || !hasPermission(session.user, "users:read")) {
    redirect("/unauthorized")
  }

  const userId = params.id

  // Fetch user with their roles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Group permissions by role for display
  const rolePermissions = user.userRoles.map((userRole) => ({
    role: userRole.role.name,
    permissions: userRole.role.rolePermissions.map((rp) => rp.permission.name),
  }))

  // Check if current user has permission to edit/delete
  const canEdit = hasPermission(session.user, "users:update")
  const canDelete = hasPermission(session.user, "users:delete")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{user.name || "User"}</h1>
        </div>
        <div className="flex space-x-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/dashboard/users/${user.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {canDelete && <DeleteConfirmation id={user.id} name={user.name || user.email} type="user" />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Basic user details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{user.name || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p>{user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>User's assigned roles and their permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Assigned Roles</h3>
              <div className="flex flex-wrap gap-2">
                {user.userRoles.length > 0 ? (
                  user.userRoles.map((userRole) => (
                    <Badge key={userRole.roleId} variant="secondary">
                      {userRole.role.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No roles assigned</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Effective Permissions</h3>
              <div className="space-y-3">
                {rolePermissions.length > 0 ? (
                  rolePermissions.map((rp, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <h4 className="text-sm font-medium mb-2">{rp.role}</h4>
                      <div className="flex flex-wrap gap-1">
                        {rp.permissions.map((permission, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No permissions available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
