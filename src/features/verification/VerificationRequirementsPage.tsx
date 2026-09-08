import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import {
  createVerificationRequirement,
  fetchVerificationRequirements,
  updateVerificationRequirement,
} from '@/features/verification/api'
import {
  VERIFICATION_PARTICIPANT_TYPES,
  VERIFICATION_QUERY_KEYS,
  VERIFICATION_REQUIREMENT_TYPES,
} from '@/features/verification/constants'
import { formatFieldErrors } from '@/features/verification/format'
import type { VerificationRequirement } from '@/features/verification/types'
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

const requirementSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(255),
  description: z.string().max(5000).optional().or(z.literal('')),
  participant_type: z.enum(['BUSINESS', 'AMBASSADOR']),
  requirement_type: z.enum(['text', 'document', 'email', 'phone', 'other']),
  is_required: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(10000),
})

type RequirementFormValues = z.infer<typeof requirementSchema>

export function VerificationRequirementsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<VerificationRequirement | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<RequirementFormValues | null>(null)

  const listQuery = useQuery({
    queryKey: VERIFICATION_QUERY_KEYS.requirements,
    queryFn: ({ signal }) => fetchVerificationRequirements(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const formId = useId()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      name: '',
      description: '',
      participant_type: 'BUSINESS',
      requirement_type: 'document',
      is_required: true,
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
        description: editing.description ?? '',
        participant_type: editing.participant_type,
        requirement_type: editing.requirement_type,
        is_required: editing.is_required,
        is_active: editing.is_active,
        sort_order: editing.sort_order,
      })
    } else {
      reset({
        name: '',
        description: '',
        participant_type: 'BUSINESS',
        requirement_type: 'document',
        is_required: true,
        is_active: true,
        sort_order: 0,
      })
    }
  }, [editing, formOpen, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: RequirementFormValues) => {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
        participant_type: values.participant_type,
        requirement_type: values.requirement_type,
        is_required: values.is_required,
        is_active: values.is_active,
        sort_order: values.sort_order,
      }

      if (editing) {
        return updateVerificationRequirement(editing.id, payload)
      }
      return createVerificationRequirement(payload)
    },
    onSuccess: async () => {
      setSuccessMessage(editing ? 'Requirement updated.' : 'Requirement created.')
      setFormOpen(false)
      setEditing(null)
      setPendingValues(null)
      setFormError(null)
      await queryClient.invalidateQueries({ queryKey: VERIFICATION_QUERY_KEYS.requirements })
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setFormError(error.message)
        const mapped = formatFieldErrors(error.details)
        for (const [key, message] of Object.entries(mapped)) {
          if (
            key === 'name' ||
            key === 'description' ||
            key === 'participant_type' ||
            key === 'requirement_type' ||
            key === 'sort_order'
          ) {
            setError(key, { message })
          }
        }
        return
      }
      setFormError('Unable to save requirement.')
    },
  })

  const columns = useMemo<DataTableColumn<VerificationRequirement>[]>(
    () => [
      {
        id: 'name',
        header: 'Requirement',
        cell: (row) => (
          <div className="verification-stack">
            <span className="verification-stack__primary">{row.name}</span>
            <span className="verification-stack__secondary">{row.requirement_type}</span>
          </div>
        ),
      },
      {
        id: 'participant',
        header: 'Participant',
        cell: (row) => row.participant_type,
      },
      {
        id: 'flags',
        header: 'Flags',
        cell: (row) => (
          <span className="verification-stack__secondary">
            {row.is_required ? 'required' : 'optional'} · {row.is_active ? 'active' : 'inactive'} ·
            order {row.sort_order}
          </span>
        ),
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
    <div className="verification-page">
      <PageHeader
        title="Verification requirements"
        description="Configure dynamic verification requirements for Business and Ambassador participants."
        breadcrumbs={[{ label: 'Verification', to: '/verification' }, { label: 'Requirements' }]}
        actions={
          <div className="verification-actions">
            <Link className="ui-button ui-button--secondary" to="/verification">
              Back to submissions
            </Link>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
                setSuccessMessage(null)
                setFormError(null)
              }}
            >
              Create requirement
            </Button>
          </div>
        }
      />

      {successMessage ? (
        <Notice tone="success" title="Saved">
          {successMessage}
        </Notice>
      ) : null}

      {formOpen ? (
        <section className="verification-panel" aria-labelledby={`${formId}-title`}>
          <h2 id={`${formId}-title`}>{editing ? 'Edit requirement' : 'Create requirement'}</h2>
          <form
            className="verification-requirement-form"
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
            <div className="verification-requirement-form__grid">
              <TextField
                id={`${formId}-name`}
                label="Name"
                error={errors.name?.message}
                {...register('name')}
              />
              <SelectField
                id={`${formId}-participant`}
                label="Participant type"
                error={errors.participant_type?.message}
                {...register('participant_type')}
              >
                {VERIFICATION_PARTICIPANT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id={`${formId}-type`}
                label="Requirement type"
                error={errors.requirement_type?.message}
                {...register('requirement_type')}
              >
                {VERIFICATION_REQUIREMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
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

            <div className="verification-requirement-form__checks">
              <label className="verification-check">
                <input type="checkbox" {...register('is_required')} />
                Required
              </label>
              <label className="verification-check">
                <input type="checkbox" {...register('is_active')} />
                Active
              </label>
            </div>

            {formError ? (
              <p className="field__error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="verification-actions">
              <Button
                variant="ghost"
                type="button"
                disabled={isSubmitting || saveMutation.isPending}
                onClick={() => {
                  setFormOpen(false)
                  setEditing(null)
                  setFormError(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save requirement'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingValues != null}
        title="Deactivate verification requirement"
        description="This requirement will become inactive. New verification submissions will no longer use it until it is activated again."
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
          title="Unable to load requirements"
          description={
            listQuery.error instanceof ApiClientError
              ? listQuery.error.message
              : 'Requirements could not be loaded.'
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
          emptyTitle="No verification requirements configured."
          emptyDescription="Create requirements for Business and Ambassador participants to begin collecting verification submissions."
          caption="Verification requirements"
        />
      )}
    </div>
  )
}
