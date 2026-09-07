import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  createAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
} from '@/features/configuration/api'
import { CATEGORY_LISTING_STATUSES, CONFIG_QUERY_KEYS } from '@/features/configuration/constants'
import {
  formatActiveLabel,
  formatConfigTimestamp,
  formatFieldErrors,
  formatListingStatusLabel,
} from '@/features/configuration/format'
import type { AdminCategory, CategoryListingStatus } from '@/features/configuration/types'
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
  TextAreaField,
  TextField,
  type DataTableColumn,
} from '@/shared/ui'

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(255),
  slug: z.string().trim().max(255).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  listing_status: z.enum(['allowed', 'restricted', 'prohibited']),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(10000),
})

type CategoryFormValues = z.infer<typeof categorySchema>

export function CategoriesConfigPage() {
  const queryClient = useQueryClient()
  const formId = useId()
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<CategoryFormValues | null>(null)

  const listQuery = useQuery({
    queryKey: CONFIG_QUERY_KEYS.categories,
    queryFn: ({ signal }) => fetchAdminCategories(signal),
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
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      listing_status: 'allowed',
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
        slug: editing.slug ?? '',
        description: editing.description ?? '',
        listing_status: editing.listing_status,
        is_active: editing.is_active,
        sort_order: editing.sort_order,
      })
    } else {
      reset({
        name: '',
        slug: '',
        description: '',
        listing_status: 'allowed',
        is_active: true,
        sort_order: 0,
      })
    }
  }, [editing, formOpen, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = {
        name: values.name.trim(),
        slug: values.slug?.trim() ? values.slug.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        listing_status: values.listing_status as CategoryListingStatus,
        is_active: values.is_active,
        sort_order: values.sort_order,
      }
      if (editing) {
        return updateAdminCategory(editing.id, payload)
      }
      return createAdminCategory(payload)
    },
    onSuccess: async () => {
      setSuccessMessage(editing ? 'Category updated.' : 'Category created.')
      setFormOpen(false)
      setEditing(null)
      setPendingValues(null)
      setFormError(null)
      await queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.categories })
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
            key === 'slug' ||
            key === 'description' ||
            key === 'listing_status' ||
            key === 'sort_order'
          ) {
            setError(key as keyof CategoryFormValues, { message })
          }
        }
        return
      }
      setFormError('Unable to save category.')
    },
  })

  const columns = useMemo<DataTableColumn<AdminCategory>[]>(
    () => [
      {
        id: 'name',
        header: 'Category',
        cell: (row) => (
          <div className="config-stack">
            <span className="config-primary">{row.name}</span>
            <span className="config-muted">{row.slug}</span>
          </div>
        ),
      },
      {
        id: 'listing',
        header: 'Listing status',
        cell: (row) => (
          <div className="config-stack">
            <span
              className={
                row.listing_status === 'prohibited'
                  ? 'config-status config-status--danger'
                  : row.listing_status === 'restricted'
                    ? 'config-status config-status--warning'
                    : 'config-status'
              }
            >
              {formatListingStatusLabel(row.listing_status)}
            </span>
            <span className="config-muted">
              {CATEGORY_LISTING_STATUSES.find((item) => item.value === row.listing_status)?.meaning}
            </span>
          </div>
        ),
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
        cell: (row) => row.sort_order,
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
  const confirmOpen = pendingValues != null

  return (
    <div className="config-page">
      <PageHeader
        title="Categories"
        description="Manage marketplace category listing status and availability. Prohibited categories are not assignable."
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Categories' }]}
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
            Create category
          </Button>
        }
      />

      <ConfigurationDomainNav />

      {successMessage ? (
        <Notice tone="success" title="Saved">
          {successMessage}
        </Notice>
      ) : null}

      {formOpen ? (
        <section className="config-panel" aria-labelledby={`${formId}-title`}>
          <h2 id={`${formId}-title`}>{editing ? 'Edit category' : 'Create category'}</h2>
          <form
            className="config-form"
            onSubmit={handleSubmit(async (values) => {
              setFormError(null)
              const becomingInactive = editing?.is_active && !values.is_active
              const becomingProhibited =
                values.listing_status === 'prohibited' && editing?.listing_status !== 'prohibited'
              if (becomingInactive || becomingProhibited) {
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
                id={`${formId}-slug`}
                label="Slug (optional)"
                error={errors.slug?.message}
                {...register('slug')}
              />
              <SelectField
                id={`${formId}-listing`}
                label="Listing status"
                error={errors.listing_status?.message}
                {...register('listing_status')}
              >
                {CATEGORY_LISTING_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
              <TextAreaField
                id={`${formId}-description`}
                label="Description"
                rows={3}
                error={errors.description?.message}
                {...register('description')}
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
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save category'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm category change"
        description="This change may affect marketplace assignability or discoverability. Continue only if intentional."
        confirmLabel="Confirm save"
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
          title="Unable to load categories"
          description={
            listQuery.error instanceof ApiClientError
              ? listQuery.error.message
              : 'Categories could not be loaded.'
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
          emptyTitle="No categories configured."
          emptyDescription="Create the first marketplace category to begin configuration."
          caption="Admin categories"
        />
      )}
    </div>
  )
}
