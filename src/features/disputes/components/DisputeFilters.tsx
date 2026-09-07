import { useSearchParams } from 'react-router-dom'
import { DISPUTE_QUEUE_VIEW_OPTIONS } from '@/features/disputes/constants'
import type { DisputeQueueView } from '@/features/disputes/types'
import { Button, FilterBar, SelectField } from '@/shared/ui'

export function DisputeFilters({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = (searchParams.get('view') as DisputeQueueView | null) ?? 'actionable'

  function updateView(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next === 'actionable') {
      params.delete('view')
    } else {
      params.set('view', next)
    }
    params.delete('page')
    setSearchParams(params)
  }

  return (
    <FilterBar>
      <SelectField
        id="dispute-view-filter"
        label="Queue view"
        value={view}
        onChange={(event) => updateView(event.target.value)}
      >
        {DISPUTE_QUEUE_VIEW_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <div className="dispute-filters__actions">
        <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
    </FilterBar>
  )
}
