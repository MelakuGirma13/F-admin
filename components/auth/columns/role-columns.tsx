'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/auth-utils'

export function useRoleColumns(): ColumnDef<any, any>[] {
  const { data: session } = useSession()

  const canEdit = session?.user && hasPermission(session.user, "roles:update")

  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "permissionsCount",
      header: "Permissions",
    },
    {
      accessorKey: "usersCount",
      header: "Users",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/roles/${row.original.id}`}>View</Link>
          </Button>
          {canEdit&& (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/roles/${row.original.id}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      ),
    },
  ]
}
