'use client'

import { DataTable } from '../data-table'
import { usePermissionColumns } from './permission-columns'
import { useRoleColumns } from './role-columns'
import { useUserColumns } from './user-columns'

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
