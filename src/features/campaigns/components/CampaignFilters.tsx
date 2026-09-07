import { useSearchParams } from 'react-router-dom'
import { CAMPAIGN_STATUS_FILTER_OPTIONS } from '@/features/campaigns/constants'
import { Button, FilterBar, SelectField } from '@/shared/ui'

export function CampaignFilters({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusValue = searchParams.get('status') ?? 'submitted'

  function updateStatus(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next === 'all') {
      params.set('status', 'all')
    } else {
      params.set('status', next)
    }
    params.delete('page')
    setSearchParams(params)
  }

  return (
    <FilterBar>
      <SelectField
        id="campaign-status-filter"
        label="Status"
        value={statusValue}
        onChange={(event) => updateStatus(event.target.value)}
      >
        {CAMPAIGN_STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <div className="campaign-filters__actions">
        <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
    </FilterBar>
  )
}
