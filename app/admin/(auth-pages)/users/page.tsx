
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import db from "@/lib/db"
import TableWrapper from "@/components/auth/columns/TableWrapper"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; per_page?: string; search?: string }
}) {
  const session = await auth()

  // Check if user has permission to view users
  if (!session || !hasPermission(session.user, "users:read")) {
    redirect("/unauthorized")
  }

  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.per_page) || 10
  const search = searchParams.search || ""

  // Calculate pagination
  const skip = (page - 1) * pageSize

  // Fetch users with their roles
  const users = await db.user.findMany({
    skip,
    take: pageSize,
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Get total count for pagination
  const totalUsers = await db.user.count({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
  })

  // Format users for the data table
  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name || "N/A",
    email: user.email,
    roles: user.userRoles.map((ur) => ur.role.name).join(", "),
    createdAt: user.createdAt.toLocaleDateString(),
  }))

  

  const canCreateUser = hasPermission(session.user, "users:create")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and their roles</p>
        </div>
        {canCreateUser && (
          <Button asChild>
            <Link href="/dashboard/users/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        )}
      </div>

      <TableWrapper
        type="user"
        data={formattedUsers}
        pageCount={Math.ceil(totalUsers / pageSize)}
        pageSize={pageSize}
        pageIndex={page - 1}
        searchValue={search}
      />
    </div>
  )
}
