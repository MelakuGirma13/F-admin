'use client'

import { DataTable } from '@/components/data-table'
import { useUserColumns } from '@/components/columns/user-columns'
import { usePermissionColumns } from './permission-columns'
import { useRoleColumns } from './role-columns'

type TableType = 'user' | 'permission' | 'role'

interface TableWrapperProps {
  type: TableType
  data: any[]
  pageCount: number
  pageSize: number
  pageIndex: number
  searchValue: string
}

export default function TableWrapper({
  type,
  data,
  pageCount,
  pageSize,
  pageIndex,
  searchValue,
}: TableWrapperProps) {
  let columns;

  switch (type) {
    case 'user':
      columns = useUserColumns();
      break;
    case 'permission':
      columns = usePermissionColumns();
      break;
    case 'role':
      columns = useRoleColumns();
      break;
    default:
      throw new Error(`Unsupported table type: ${type}`);
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      pageCount={pageCount}
      pageSize={pageSize}
      pageIndex={pageIndex}
      searchValue={searchValue}
    />
  );
}
