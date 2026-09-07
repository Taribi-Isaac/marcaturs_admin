import type { ReactNode } from 'react'

export type FilterBarProps = {
  children: ReactNode
  'aria-label'?: string
}

export function FilterBar({ children, 'aria-label': ariaLabel = 'Filters' }: FilterBarProps) {
  return (
    <div className="filter-bar" role="search" aria-label={ariaLabel}>
      {children}
    </div>
  )
}
