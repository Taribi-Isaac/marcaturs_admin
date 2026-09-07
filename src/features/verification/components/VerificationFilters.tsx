import { Link, useSearchParams } from 'react-router-dom'
import type { VerificationSubmissionStatus } from '@/shared/types/domain'
import { VERIFICATION_STATUS_OPTIONS } from '@/features/verification/constants'
import { FilterBar, SelectField } from '@/shared/ui'

export function VerificationFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = (searchParams.get('status') ?? '') as '' | VerificationSubmissionStatus

  function updateStatus(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next) {
      params.set('status', next)
    } else {
      params.delete('status')
    }
    params.delete('page')
    setSearchParams(params)
  }

  return (
    <FilterBar>
      <SelectField
        id="verification-status-filter"
        label="Status"
        value={status}
        onChange={(event) => updateStatus(event.target.value)}
      >
        {VERIFICATION_STATUS_OPTIONS.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <div className="verification-filters__actions">
        <Link className="ui-button ui-button--secondary" to="/verification/requirements">
          Manage requirements
        </Link>
      </div>
    </FilterBar>
  )
}
