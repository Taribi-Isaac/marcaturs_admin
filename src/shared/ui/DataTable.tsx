import type { ReactNode } from 'react'
import { EmptyState, LoadingState } from './StatePanels'

export type DataTableColumn<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  compact?: boolean
  caption?: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  emptyTitle = 'No records',
  emptyDescription = 'There is nothing to show here yet.',
  compact = true,
  caption,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState label="Loading records" rows={5} />
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="data-table-wrap">
      <table
        className={['data-table', compact ? 'data-table--compact' : ''].filter(Boolean).join(' ')}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                style={{
                  textAlign: column.align ?? 'left',
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((column) => (
                <td key={column.id} style={{ textAlign: column.align ?? 'left' }}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
