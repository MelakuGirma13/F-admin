
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import db from "@/lib/db"
import TableWrapper from "@/components/auth/columns/TableWrapper"

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: { page?: string; per_page?: string; search?: string }
}) {
  const session = await auth()

  // Check if user has permission to view permissions
  if (!session || !hasPermission(session.user, "permissions:read")) {
    redirect("/unauthorized")
  }

  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.per_page) || 10
  const search = searchParams.search || ""

  // Calculate pagination
  const skip = (page - 1) * pageSize

  // Fetch permissions with their roles count
  const permissions = await db.permission.findMany({
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
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Get total count for pagination
  const totalPermissions = await db.permission.count({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
  })

  // Format permissions for the data table
  const formattedPermissions = permissions.map((permission) => ({
    id: permission.id,
    name: permission.name,
    description: permission.description || "N/A",
    rolesCount: permission._count.rolePermissions,
    createdAt: permission.createdAt.toLocaleDateString(),
  }))

  const canCreatePermission = hasPermission(session.user, "permissions:assign")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground">Manage permissions in the system</p>
        </div>
        {canCreatePermission && (
          <Button asChild>
            <Link href="/dashboard/permissions/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Permission
            </Link>
          </Button>
        )}
      </div>

      <TableWrapper
       type="permission"
        data={formattedPermissions}
        pageCount={Math.ceil(totalPermissions / pageSize)}
        pageSize={pageSize}
        pageIndex={page - 1}
        searchValue={search}
      />
    </div>
  )
}
