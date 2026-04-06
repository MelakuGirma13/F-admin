import { prisma } from "./prisma"

export async function getUserWithRolesAndPermissions(userId: string) {
  return await prisma.user.findUnique({
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
}

export function hasPermission(user: any, permissionName: string): boolean {
  if (!user || !user.roles) return false

  for (const role of user.roles) {
    if (role.permissions.some((p: any) => p.name === permissionName)) {
      return true
    }
  }

  return false
}

export function hasRole(user: any, roleName: string): boolean {
  if (!user || !user.roles) return false
  return user.roles.some((r: any) => r.name === roleName)
}
