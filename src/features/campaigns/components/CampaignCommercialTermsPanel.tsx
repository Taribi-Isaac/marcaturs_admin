import { useId } from 'react'
import {
  displayCampaignText,
  formatCampaignCommission,
  formatCampaignMoney,
  formatCampaignTimestamp,
} from '@/features/campaigns/format'
import type { CampaignCurrentVersionSummary } from '@/features/campaigns/types'
import { formatStatusLabel } from '@/shared/lib/status'

export function hasPublishedCommercialTerms(
  version: CampaignCurrentVersionSummary | null | undefined,
): boolean {
  if (!version || version.status !== 'published') {
    return false
  }
  return (
    version.product_name != null ||
    version.product_description != null ||
    version.price_amount != null ||
    version.commission_type != null ||
    version.terms != null ||
    version.payment_destination_name != null ||
    version.published_at != null
  )
}

function Field({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'campaign-dl__full' : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function CampaignCommercialTermsPanel({
  version,
}: {
  version: CampaignCurrentVersionSummary | null | undefined
}) {
  const headingId = useId()

  if (!version) {
    return (
      <section className="campaign-panel campaign-panel--wide" aria-labelledby={headingId}>
        <h2 id={headingId}>Current Campaign Version</h2>
        <p className="campaign-muted">
          No current Campaign Version is attached to this campaign. Published commercial terms will
          appear here when a published version is bound.
        </p>
      </section>
    )
  }

  const commercial = hasPublishedCommercialTerms(version)

  return (
    <section className="campaign-panel campaign-panel--wide" aria-labelledby={headingId}>
      <h2 id={headingId}>Current Campaign Version</h2>
      <p className="campaign-muted">
        Contextual commercial definition for this Campaign Version. This is not a Deal Snapshot —
        existing Deals keep their own immutable commercial truth.
      </p>

      <dl className="campaign-dl">
        <Field label="Version ID" value={`#${version.id}`} />
        <Field label="Version number" value={`v${version.version_number}`} />
        <Field label="Version status" value={formatStatusLabel(version.status)} />
        <Field label="Published" value={formatCampaignTimestamp(version.published_at)} />
      </dl>

      {!commercial ? (
        <p className="campaign-muted">
          Published commercial terms are not available for this version. The Admin API exposes
          product, pricing, commission, and payment-destination fields only when the current version
          is published.
        </p>
      ) : (
        <div className="campaign-commercial">
          <div className="campaign-commercial__block">
            <h3>Product / Pricing</h3>
            <dl className="campaign-dl">
              <Field label="Product name" value={displayCampaignText(version.product_name)} />
              <Field
                label="Pricing method"
                value={version.pricing_method ? formatStatusLabel(version.pricing_method) : '—'}
              />
              <Field
                label="Price"
                value={formatCampaignMoney(version.price_amount, version.price_currency)}
              />
              <Field label="Currency" value={displayCampaignText(version.price_currency)} />
              <Field
                label="Product description"
                value={displayCampaignText(version.product_description)}
                full
              />
              <Field label="Service area" value={displayCampaignText(version.service_area)} full />
            </dl>
          </div>

          <div className="campaign-commercial__block">
            <h3>Commission</h3>
            <dl className="campaign-dl">
              <Field
                label="Commission type"
                value={version.commission_type ? formatStatusLabel(version.commission_type) : '—'}
              />
              <Field
                label="Rate / amount"
                value={formatCampaignCommission(
                  version.commission_type,
                  version.commission_rate,
                  version.commission_amount,
                  version.price_currency,
                )}
              />
              <Field
                label="Trigger"
                value={
                  version.commission_trigger ? formatStatusLabel(version.commission_trigger) : '—'
                }
              />
              <Field
                label="Payment deadline"
                value={
                  version.commission_payment_deadline_days != null
                    ? `${version.commission_payment_deadline_days} days`
                    : '—'
                }
              />
              <Field
                label="Trigger description"
                value={displayCampaignText(version.commission_trigger_description)}
                full
              />
              <Field
                label="Minimum qualifying amount"
                value={formatCampaignMoney(
                  version.minimum_qualifying_amount,
                  version.price_currency,
                )}
              />
              <Field
                label="Qualifying conditions"
                value={displayCampaignText(version.qualifying_conditions)}
                full
              />
            </dl>
          </div>

          <div className="campaign-commercial__block">
            <h3>Policies / Restrictions</h3>
            <dl className="campaign-dl">
              <Field
                label="Refund / cancellation rules"
                value={displayCampaignText(version.refund_cancellation_rules)}
                full
              />
              <Field
                label="Approved claims"
                value={displayCampaignText(version.approved_claims)}
                full
              />
              <Field
                label="Prohibited claims"
                value={displayCampaignText(version.prohibited_claims)}
                full
              />
              <Field
                label="Brand-use rules"
                value={displayCampaignText(version.brand_use_rules)}
                full
              />
              <Field
                label="Geographic / customer restrictions"
                value={displayCampaignText(version.geographic_customer_restrictions)}
                full
              />
            </dl>
          </div>

          <div className="campaign-commercial__block">
            <h3>Marketing / Terms</h3>
            <dl className="campaign-dl">
              <Field
                label="Approved copy"
                value={displayCampaignText(version.approved_copy)}
                full
              />
              <Field
                label="Marketing links"
                value={
                  version.marketing_links && version.marketing_links.length > 0
                    ? version.marketing_links.join(', ')
                    : '—'
                }
                full
              />
              <Field label="Terms" value={displayCampaignText(version.terms)} full />
            </dl>
          </div>

          <div className="campaign-commercial__block">
            <h3>Payment destination</h3>
            <p className="campaign-muted">
              Safe destination metadata only. Account identifiers, payment instructions, and payment
              contact are never shown in Admin.
            </p>
            <dl className="campaign-dl">
              <Field
                label="Destination name"
                value={displayCampaignText(version.payment_destination_name)}
              />
              <Field
                label="Payment provider"
                value={displayCampaignText(version.payment_provider)}
              />
            </dl>
          </div>
        </div>
      )}
    </section>
  )
}
