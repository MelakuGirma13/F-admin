
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import TableWrapper from "@/components/auth/columns/TableWrapper"
import db from "@/lib/db"

export default async function RolesPage({
  searchParams,
}: {
  searchParams: { page?: string; per_page?: string; search?: string }
}) {
  const session = await auth()

  // Check if user has permission to view roles
  if (!session || !hasPermission(session.user, "roles:read")) {
    redirect("/unauthorized")
  }

  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.per_page) || 10
  const search = searchParams.search || ""

  // Calculate pagination
  const skip = (page - 1) * pageSize

  // Fetch roles with their permissions count
  const roles = await db.role.findMany({
    skip,
    take: pageSize,
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: {
          rolePermissions: true,
          userRoles: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Get total count for pagination
  const totalRoles = await db.role.count({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
  })

  // Format roles for the data table
  const formattedRoles = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description || "N/A",
    permissionsCount: role._count.rolePermissions,
    usersCount: role._count.userRoles,
    createdAt: role.createdAt.toLocaleDateString(),
  }))


  const canCreateRole = hasPermission(session.user, "roles:create")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">Manage roles and their permissions</p>
        </div>
        {canCreateRole && (
          <Button asChild>
            <Link href="/admin/roles/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Role
            </Link>
          </Button>
        )}
      </div>

      <TableWrapper
         type="role"
        data={formattedRoles}
        pageCount={Math.ceil(totalRoles / pageSize)}
        pageSize={pageSize}
        pageIndex={page - 1}
        searchValue={search}
      />
    </div>
  )
}
