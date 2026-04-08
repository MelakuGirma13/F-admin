import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Shield, Key, Settings } from "lucide-react"
import db from "@/lib/db"
import { ProfileForm } from "@/components/auth/profile-form"
import { PasswordChangeForm } from "@/components/auth/password-change-form"

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Fetch user with their roles and permissions
  const user = await db.user.findUnique({
    where: { id: session.user?.id },
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
    redirect("/login")
  }

  // Group permissions by role for display
  const rolePermissions = user.userRoles.map((userRole) => ({
    role: userRole.role.name,
    roleDescription: userRole.role.description,
    permissions: userRole.role.rolePermissions.map((rp) => rp.permission.name),
  }))

  // Get all unique permissions
  const allPermissions = Array.from(
    new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.name))),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                {/* <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name || "User"} /> */}
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user.name || "Unnamed User"}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Roles</h3>
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
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Created</h3>
              <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
              <p className="text-sm">{new Date(user.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Permissions
              </TabsTrigger>
              {/* <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="general">
              <ProfileForm user={user} />
            </TabsContent>

            <TabsContent value="security">
              <PasswordChangeForm />
            </TabsContent>

            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle>Your Permissions</CardTitle>
                  <CardDescription>Permissions granted through your assigned roles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {rolePermissions.length > 0 ? (
                    rolePermissions.map((rp, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium">{rp.role}</h3>
                          <Badge variant="outline">{rp.permissions.length} permissions</Badge>
                        </div>
                        {rp.roleDescription && (
                          <p className="text-sm text-muted-foreground mb-3">{rp.roleDescription}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {rp.permissions.map((permission, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No permissions available</p>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">All Effective Permissions</h3>
                    <div className="flex flex-wrap gap-2">
                      {allPermissions.map((permission, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your account preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Preference settings will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
