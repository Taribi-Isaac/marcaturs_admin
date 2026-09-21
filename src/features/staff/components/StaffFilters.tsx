import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { STAFF_ROLE_FILTER_OPTIONS, STAFF_STATUS_FILTER_OPTIONS } from '@/features/staff/constants'
import { Button, TextField, FilterBar, SelectField } from '@/shared/ui'

export function StaffFilters({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const roleValue = searchParams.get('staff_role') ?? 'all'
  const statusValue = searchParams.get('status') ?? 'all'
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

  function updateParam(key: 'staff_role' | 'status', next: string) {
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

  const hasFilters = roleValue !== 'all' || statusValue !== 'all' || Boolean(qFromUrl)

  return (
    <FilterBar>
      <SelectField
        id="staff-role-filter"
        label="Staff role"
        value={roleValue}
        onChange={(event) => updateParam('staff_role', event.target.value)}
      >
        {STAFF_ROLE_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="staff-status-filter"
        label="Account status"
        value={statusValue}
        onChange={(event) => updateParam('status', event.target.value)}
      >
        {STAFF_STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <TextField
        id="staff-search"
        label="Search"
        value={searchDraft}
        onChange={(event) => setSearchDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            applySearch()
          }
        }}
        placeholder="Name or email"
        autoComplete="off"
      />

      <div className="users-filters__actions">
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
