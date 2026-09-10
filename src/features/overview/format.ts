import { CAMPAIGN_STATUS_ORDER } from './constants'

export function formatCampaignStatusLabel(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatDisputeStatusLabel(status: string): string {
  return formatCampaignStatusLabel(status)
}

export function formatGeneratedAt(iso: string, timezone: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  try {
    return `${new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(date)} (${timezone})`
  } catch {
    return `${date.toISOString()} (${timezone})`
  }
}

export function orderedCampaignStatuses(
  byStatus: Record<string, number>,
): Array<{ status: string; count: number }> {
  const known = new Set<string>(CAMPAIGN_STATUS_ORDER)
  const ordered = CAMPAIGN_STATUS_ORDER.map((status) => ({
    status,
    count: byStatus[status] ?? 0,
  }))
  const extras = Object.entries(byStatus)
    .filter(([status]) => !known.has(status))
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => a.status.localeCompare(b.status))
  return [...ordered, ...extras]
}
