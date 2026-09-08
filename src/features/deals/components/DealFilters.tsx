import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DEAL_COMMISSION_OVERDUE_FILTER_OPTIONS,
  DEAL_COMMISSION_STATUS_FILTER_OPTIONS,
  DEAL_OPEN_DISPUTE_FILTER_OPTIONS,
  DEAL_STATUS_FILTER_OPTIONS,
} from '@/features/deals/constants'
import { Button, FilterBar, SelectField, TextField } from '@/shared/ui'

export function DealFilters({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusValue = searchParams.get('status') ?? 'all'
  const openDisputeValue = searchParams.get('open_dispute') === '1' ? '1' : 'all'
  const overdueValue = searchParams.get('commission_overdue') === '1' ? '1' : 'all'
  const commissionStatusValue = searchParams.get('commission_status') ?? 'all'
  const qFromUrl = searchParams.get('q') ?? ''
  const [searchDraft, setSearchDraft] = useState(qFromUrl)

  useEffect(() => {
    const trimmed = searchDraft.trim()
    if (trimmed === qFromUrl.trim()) {
      return
    }

    const handle = window.setTimeout(() => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous)
        const nextQ = searchDraft.trim()
        const currentQ = params.get('q') ?? ''
        if (nextQ === currentQ.trim()) {
          return previous
        }
        if (nextQ) {
          params.set('q', nextQ)
        } else {
          params.delete('q')
        }
        params.delete('page')
        return params
      })
    }, 350)

    return () => window.clearTimeout(handle)
  }, [searchDraft, qFromUrl, setSearchParams])

  function updateParam(
    key: 'status' | 'open_dispute' | 'commission_overdue' | 'commission_status',
    next: string,
  ) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (next === 'all') {
        params.delete(key)
      } else {
        params.set(key, next)
      }
      params.delete('page')
      return params
    })
  }

  function applySearch() {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      const trimmed = searchDraft.trim()
      if (trimmed) {
        params.set('q', trimmed)
      } else {
        params.delete('q')
      }
      params.delete('page')
      return params
    })
  }

  function resetFilters() {
    setSearchDraft('')
    setSearchParams({})
  }

  const hasFilters =
    statusValue !== 'all' ||
    openDisputeValue !== 'all' ||
    overdueValue !== 'all' ||
    commissionStatusValue !== 'all' ||
    Boolean(qFromUrl)

  return (
    <FilterBar>
      <SelectField
        id="deal-status-filter"
        label="Status"
        value={statusValue}
        onChange={(event) => updateParam('status', event.target.value)}
      >
        {DEAL_STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="deal-open-dispute-filter"
        label="Open dispute"
        value={openDisputeValue}
        onChange={(event) => updateParam('open_dispute', event.target.value)}
      >
        {DEAL_OPEN_DISPUTE_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="deal-commission-overdue-filter"
        label="Commission overdue"
        value={overdueValue}
        onChange={(event) => updateParam('commission_overdue', event.target.value)}
      >
        {DEAL_COMMISSION_OVERDUE_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="deal-commission-status-filter"
        label="Commission status"
        value={commissionStatusValue}
        onChange={(event) => updateParam('commission_status', event.target.value)}
      >
        {DEAL_COMMISSION_STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <TextField
        id="deal-search"
        label="Search"
        value={searchDraft}
        onChange={(event) => setSearchDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            applySearch()
          }
        }}
        placeholder="Deal ID, party, campaign, product, evidence reference"
        autoComplete="off"
      />

      <div className="deals-filters__actions">
        <Button variant="secondary" onClick={applySearch}>
          Search
        </Button>
        {hasFilters ? (
          <Button variant="ghost" onClick={resetFilters}>
            Reset
          </Button>
        ) : null}
        <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
    </FilterBar>
  )
}
