import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Edit, User } from "lucide-react"
import { DeleteConfirmation } from "@/components/auth/delete-confirmation"
import db from "@/lib/db"

export default async function RoleDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  // Check if user has permission to view roles
  if (!session || !hasPermission(session.user, "roles:read")) {
    redirect("/unauthorized")
  }

  const roleId = params.id

  // Fetch role with its permissions and users
  const role = await db.role.findUnique({
    where: { id: roleId },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      userRoles: {
        include: {
          user: true,
        },
        take: 10, // Limit to 10 users for display
      },
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
  })

  if (!role) {
    notFound()
  }

  // Group permissions by category for display
  const groupedPermissions = role.rolePermissions.reduce(
    (acc, rp) => {
      const category = rp.permission.name.split(":")[0]
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(rp.permission)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Check if current user has permission to edit/delete
  const canEdit = hasPermission(session.user, "roles:update")
  const canDelete = hasPermission(session.user, "roles:delete")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/roles">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
        </div>
        <div className="flex space-x-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/admin/roles/${role.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {canDelete && <DeleteConfirmation id={role.id} name={role.name} type="role" />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>Basic role details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{role.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p>{role.description || "No description provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{new Date(role.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p>{new Date(role.updatedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Users with this role</h3>
              <p>{role._count.userRoles}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Permissions assigned to this role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(groupedPermissions).length > 0 ? (
              Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="border rounded-md p-3">
                  <h3 className="text-sm font-medium mb-2 capitalize">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((permission) => (
                      <Badge key={permission.id} variant="secondary">
                        {permission.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No permissions assigned</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Users with this Role</CardTitle>
            <CardDescription>
              {role._count.userRoles > 0
                ? `Showing ${Math.min(role.userRoles.length, 10)} of ${role._count.userRoles} users`
                : "No users have this role"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {role.userRoles.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {role.userRoles.map((userRole) => (
                  <Link
                    key={userRole.userId}
                    href={`/admin/users/${userRole.userId}`}
                    className="flex items-center space-x-3 border rounded-md p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex-shrink-0 bg-muted rounded-full p-2">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{userRole.user.name || "Unnamed User"}</p>
                      <p className="text-sm text-muted-foreground">{userRole.user.email}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No users have been assigned this role yet</p>
            )}
            {role._count.userRoles > 10 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href={`/admin/users?role=${role.id}`}>View All Users</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
