import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  createExtensionPackage,
  createFeaturedPackage,
  fetchExtensionPackages,
  fetchFeaturedPackages,
  updateExtensionPackage,
  updateFeaturedPackage,
} from '@/features/configuration/api'
import { CONFIG_QUERY_KEYS, PACKAGE_CURRENCY_OPTIONS } from '@/features/configuration/constants'
import {
  formatActiveLabel,
  formatAmountMinor,
  formatConfigTimestamp,
  formatFieldErrors,
  majorAmountToMinor,
  minorAmountToMajorInput,
} from '@/features/configuration/format'
import type { PackageDomain, PlatformPackage } from '@/features/configuration/types'
import { ConfigurationDomainNav } from '@/features/configuration/components/ConfigurationDomainNav'
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  ForbiddenState,
  Notice,
  PageHeader,
  SelectField,
  TextField,
  type DataTableColumn,
} from '@/shared/ui'

const packageSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(255),
  duration_days: z.number().int().min(1, 'Duration must be at least 1 day.').max(3650),
  amount_major: z
    .string()
    .trim()
    .min(1, 'Price is required.')
    .refine((value) => majorAmountToMinor(value) != null && (majorAmountToMinor(value) ?? 0) >= 1, {
      message: 'Enter a valid price with up to 2 decimal places (minimum 0.01).',
    }),
  currency: z.enum(['NGN']),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(10000),
})

type PackageFormValues = z.infer<typeof packageSchema>

const copy: Record<
  PackageDomain,
  {
    title: string
    description: string
    emptyTitle: string
    createLabel: string
    boundary: string
  }
> = {
  extension: {
    title: 'Extension packages',
    description: 'Configure paid Campaign Extension products. These extend listing duration only.',
    emptyTitle: 'No extension packages configured.',
    createLabel: 'Create extension package',
    boundary:
      'Platform monetization only. This does not receive customer payments or settle ambassador commissions.',
  },
  featured: {
    title: 'Featured packages',
    description:
      'Configure paid Featured visibility products. These are time-bound platform entitlements.',
    emptyTitle: 'No featured packages configured.',
    createLabel: 'Create featured package',
    boundary:
      'Platform monetization only. Featured visibility is separate from customer payments and commission settlement.',
  },
}

export function PackageConfigPage({ domain }: { domain: PackageDomain }) {
  const queryClient = useQueryClient()
  const formId = useId()
  const meta = copy[domain]
  const [editing, setEditing] = useState<PlatformPackage | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<PackageFormValues | null>(null)

  const listQuery = useQuery({
    queryKey: CONFIG_QUERY_KEYS.packages(domain),
    queryFn: ({ signal }) =>
      domain === 'extension' ? fetchExtensionPackages(signal) : fetchFeaturedPackages(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: '',
      duration_days: 30,
      amount_major: '0.01',
      currency: 'NGN',
      is_active: true,
      sort_order: 0,
    },
  })

  useEffect(() => {
    if (!formOpen) {
      return
    }
    if (editing) {
      reset({
        name: editing.name,
        duration_days: editing.duration_days,
        amount_major: minorAmountToMajorInput(editing.amount_minor),
        currency: (editing.currency as 'NGN') || 'NGN',
        is_active: editing.is_active ?? true,
        sort_order: editing.sort_order ?? 0,
      })
    } else {
      reset({
        name: '',
        duration_days: 30,
        amount_major: '0.01',
        currency: 'NGN',
        is_active: true,
        sort_order: 0,
      })
    }
  }, [editing, formOpen, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: PackageFormValues) => {
      const amountMinor = majorAmountToMinor(values.amount_major)
      if (amountMinor == null || amountMinor < 1) {
        throw new Error('Invalid amount')
      }
      const payload = {
        name: values.name.trim(),
        duration_days: values.duration_days,
        amount_minor: amountMinor,
        currency: values.currency,
        is_active: values.is_active,
        sort_order: values.sort_order,
      }
      if (domain === 'extension') {
        return editing
          ? updateExtensionPackage(editing.id, payload)
          : createExtensionPackage(payload)
      }
      return editing ? updateFeaturedPackage(editing.id, payload) : createFeaturedPackage(payload)
    },
    onSuccess: async () => {
      setSuccessMessage(editing ? 'Package updated.' : 'Package created.')
      setFormOpen(false)
      setEditing(null)
      setPendingValues(null)
      setFormError(null)
      await queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.packages(domain) })
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setFormError(
          error.status === 409
            ? error.message ||
                'The server rejected this change because the current configuration may have changed. Refresh and try again.'
            : error.message,
        )
        const mapped = formatFieldErrors(error.details)
        for (const [key, message] of Object.entries(mapped)) {
          if (
            key === 'name' ||
            key === 'duration_days' ||
            key === 'currency' ||
            key === 'sort_order'
          ) {
            setError(key as keyof PackageFormValues, { message })
          }
          if (key === 'amount_minor') {
            setError('amount_major', { message })
          }
        }
        return
      }
      setFormError('Unable to save package.')
    },
  })

  const columns = useMemo<DataTableColumn<PlatformPackage>[]>(
    () => [
      {
        id: 'name',
        header: 'Package',
        cell: (row) => <span className="config-primary">{row.name}</span>,
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: (row) => `${row.duration_days} days`,
      },
      {
        id: 'price',
        header: 'Price',
        cell: (row) => formatAmountMinor(row.amount_minor, row.currency),
      },
      {
        id: 'active',
        header: 'Active',
        cell: (row) => (
          <span className={row.is_active ? 'config-status' : 'config-status config-status--muted'}>
            {formatActiveLabel(row.is_active)}
          </span>
        ),
      },
      {
        id: 'sort',
        header: 'Order',
        cell: (row) => row.sort_order ?? '—',
      },
      {
        id: 'updated',
        header: 'Updated',
        cell: (row) => formatConfigTimestamp(row.updated_at),
      },
      {
        id: 'action',
        header: 'Action',
        align: 'right',
        cell: (row) => (
          <Button
            variant="secondary"
            onClick={() => {
              setEditing(row)
              setFormOpen(true)
              setSuccessMessage(null)
              setFormError(null)
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  )

  const forbidden = listQuery.error instanceof ApiClientError && listQuery.error.status === 403

  return (
    <div className="config-page">
      <PageHeader
        title={meta.title}
        description={meta.description}
        breadcrumbs={[{ label: 'Configuration' }, { label: meta.title }]}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
              setSuccessMessage(null)
              setFormError(null)
            }}
          >
            {meta.createLabel}
          </Button>
        }
      />

      <ConfigurationDomainNav />

      <Notice tone="info" title="Platform payment boundary">
        {meta.boundary}
      </Notice>

      {successMessage ? (
        <Notice tone="success" title="Saved">
          {successMessage}
        </Notice>
      ) : null}

      {formOpen ? (
        <section className="config-panel" aria-labelledby={`${formId}-title`}>
          <h2 id={`${formId}-title`}>{editing ? 'Edit package' : 'Create package'}</h2>
          <form
            className="config-form"
            onSubmit={handleSubmit(async (values) => {
              setFormError(null)
              if (editing?.is_active && !values.is_active) {
                setPendingValues(values)
                return
              }
              try {
                await saveMutation.mutateAsync(values)
              } catch {
                // Surfaced via onError.
              }
            })}
          >
            <div className="config-form__grid">
              <TextField
                id={`${formId}-name`}
                label="Name"
                error={errors.name?.message}
                {...register('name')}
              />
              <TextField
                id={`${formId}-duration`}
                label="Duration (days)"
                type="number"
                min={1}
                max={3650}
                error={errors.duration_days?.message}
                {...register('duration_days', { valueAsNumber: true })}
              />
              <TextField
                id={`${formId}-amount`}
                label="Price (major units)"
                inputMode="decimal"
                error={errors.amount_major?.message}
                {...register('amount_major')}
              />
              <SelectField
                id={`${formId}-currency`}
                label="Currency"
                error={errors.currency?.message}
                {...register('currency')}
              >
                {PACKAGE_CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </SelectField>
              <TextField
                id={`${formId}-sort`}
                label="Sort order"
                type="number"
                min={0}
                max={10000}
                error={errors.sort_order?.message}
                {...register('sort_order', { valueAsNumber: true })}
              />
            </div>
            <label className="config-check">
              <input type="checkbox" {...register('is_active')} />
              Active
            </label>
            {formError ? (
              <p className="field__error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="config-form__actions">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  setEditing(null)
                  setFormError(null)
                }}
                disabled={isSubmitting || saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create package'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingValues != null}
        title="Deactivate package"
        description="Inactive packages are unavailable for new purchases. Existing entitlements are unaffected by this configuration change."
        confirmLabel="Deactivate"
        tone="danger"
        onCancel={() => setPendingValues(null)}
        onConfirm={() => {
          if (!pendingValues) {
            return
          }
          const values = pendingValues
          setPendingValues(null)
          void saveMutation.mutateAsync(values).catch(() => undefined)
        }}
      />

      {forbidden ? (
        <ForbiddenState />
      ) : listQuery.error ? (
        <ErrorState
          title={`Unable to load ${meta.title.toLowerCase()}`}
          description={
            listQuery.error instanceof ApiClientError
              ? listQuery.error.message
              : 'Packages could not be loaded.'
          }
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={listQuery.data ?? []}
          getRowId={(row) => String(row.id)}
          isLoading={listQuery.isLoading}
          emptyTitle={meta.emptyTitle}
          emptyDescription="Create a package to make this platform product available."
          caption={`${meta.title} configuration`}
        />
      )}
    </div>
  )
}
