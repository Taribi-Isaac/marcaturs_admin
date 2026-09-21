import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError, triggerBrowserDownload } from '@/shared/api'
import {
  createCertificationLesson,
  createCertificationModule,
  createCertificationResource,
  deleteCertificationLesson,
  deleteCertificationModule,
  deleteCertificationResource,
  downloadCertificationResource,
  reorderCertificationLessons,
  reorderCertificationModules,
  reorderCertificationResources,
  updateCertificationLesson,
  updateCertificationModule,
  updateCertificationResource,
} from '@/features/certification/api'
import {
  CERTIFICATION_QUERY_KEYS,
  LESSON_CONTENT_TYPE_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
} from '@/features/certification/constants'
import { formatBytes } from '@/features/certification/format'
import type {
  CertificationLesson,
  CertificationModule,
  CertificationResource,
} from '@/features/certification/types'
import { formatStatusLabel } from '@/shared/lib/status'
import type { CertificationLessonContentType } from '@/shared/types/domain'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Notice,
  SelectField,
  TextAreaField,
  TextField,
} from '@/shared/ui'

type OpenForm =
  | { kind: 'module-create' }
  | { kind: 'module-edit'; moduleId: number }
  | { kind: 'lesson-create'; moduleId: number }
  | { kind: 'lesson-edit'; moduleId: number; lessonId: number }
  | { kind: 'resource-create'; moduleId: number; lessonId: number }
  | { kind: 'resource-edit'; moduleId: number; lessonId: number; resourceId: number }
  | null

type PendingConfirm = {
  title: string
  description: string
  run: () => Promise<unknown>
}

function moveInOrder<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) {
    return items
  }
  const next = [...items]
  const moved = next[index]!
  next[index] = next[target]!
  next[target] = moved
  return next
}

function ModuleForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; description: string }
  submitLabel: string
  pending: boolean
  onSubmit: (values: { title: string; description: string }) => void
  onCancel: () => void
}) {
  const formId = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  return (
    <form
      className="cert-form cert-form--inline"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ title, description })
      }}
    >
      <TextField
        id={`${formId}-title`}
        label="Module title"
        value={title}
        maxLength={255}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextAreaField
        id={`${formId}-description`}
        label="Module description"
        rows={2}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="cert-form__actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function LessonForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; description: string; contentType: string; isRequired: boolean }
  submitLabel: string
  pending: boolean
  onSubmit: (values: {
    title: string
    description: string
    contentType: string
    isRequired: boolean
  }) => void
  onCancel: () => void
}) {
  const formId = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [contentType, setContentType] = useState(initial?.contentType ?? 'text')
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? true)

  return (
    <form
      className="cert-form cert-form--inline"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ title, description, contentType, isRequired })
      }}
    >
      <TextField
        id={`${formId}-title`}
        label="Lesson title"
        value={title}
        maxLength={255}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextAreaField
        id={`${formId}-description`}
        label="Lesson description"
        rows={2}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <SelectField
        id={`${formId}-content-type`}
        label="Content type"
        value={contentType}
        onChange={(event) => setContentType(event.target.value)}
      >
        {LESSON_CONTENT_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <label className="cert-check">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(event) => setIsRequired(event.target.checked)}
        />
        Required for completion
      </label>
      <div className="cert-form__actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function ResourceForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: { type: string; title: string; bodyText: string; externalUrl: string }
  submitLabel: string
  pending: boolean
  onSubmit: (body: FormData) => void
  onCancel: () => void
}) {
  const formId = useId()
  const [type, setType] = useState(initial?.type ?? 'text')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [bodyText, setBodyText] = useState(initial?.bodyText ?? '')
  const [externalUrl, setExternalUrl] = useState(initial?.externalUrl ?? '')
  const [file, setFile] = useState<File | null>(null)

  const needsUrl = type === 'video' || type === 'external_reference'
  const needsFile = type === 'downloadable'
  const needsBody = type === 'text'

  return (
    <form
      className="cert-form cert-form--inline"
      onSubmit={(event) => {
        event.preventDefault()
        const body = new FormData()
        body.set('type', type)
        body.set('title', title)
        if (needsBody) {
          body.set('body_text', bodyText)
        }
        if (needsUrl) {
          body.set('external_url', externalUrl)
        }
        if (needsFile && file) {
          body.set('file', file)
        }
        onSubmit(body)
      }}
    >
      <SelectField
        id={`${formId}-type`}
        label="Resource type"
        value={type}
        onChange={(event) => setType(event.target.value)}
      >
        {RESOURCE_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <TextField
        id={`${formId}-title`}
        label="Resource title"
        value={title}
        maxLength={255}
        onChange={(event) => setTitle(event.target.value)}
      />
      {needsBody ? (
        <TextAreaField
          id={`${formId}-body`}
          label="Body text"
          rows={3}
          value={bodyText}
          onChange={(event) => setBodyText(event.target.value)}
        />
      ) : null}
      {needsUrl ? (
        <TextField
          id={`${formId}-url`}
          label="External URL"
          value={externalUrl}
          onChange={(event) => setExternalUrl(event.target.value)}
        />
      ) : null}
      {needsFile ? (
        <div className="field">
          <label className="field__label" htmlFor={`${formId}-file`}>
            File
          </label>
          <input
            id={`${formId}-file`}
            className="field__control"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="field__hint">
            Stored on a private disk. The console never receives a storage path or signed URL.
          </p>
        </div>
      ) : null}
      <div className="cert-form__actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function ResourceSummary({ resource }: { resource: CertificationResource }) {
  return (
    <div className="cert-stack">
      <span className="cert-primary">{resource.title}</span>
      <span className="cert-muted">
        {formatStatusLabel(String(resource.type))}
        {resource.has_file
          ? ` · ${resource.original_filename ?? 'File'} · ${formatBytes(resource.size_bytes)}`
          : ''}
      </span>
      {resource.external_url ? (
        <span className="cert-muted cert-break">{resource.external_url}</span>
      ) : null}
      {resource.body_text ? <span className="cert-muted">{resource.body_text}</span> : null}
    </div>
  )
}

export type CurriculumPanelProps = {
  programmeId: number
  versionNumber: number
  modules: CertificationModule[]
  isLoading: boolean
  /** Draft version + `certification.manage`; published content is never editable. */
  editable: boolean
}

export function CurriculumPanel({
  programmeId,
  versionNumber,
  modules,
  isLoading,
  editable,
}: CurriculumPanelProps) {
  const queryClient = useQueryClient()
  const [openForm, setOpenForm] = useState<OpenForm>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      setError(null)
      setOpenForm(null)
      await queryClient.invalidateQueries({
        queryKey: CERTIFICATION_QUERY_KEYS.modules(programmeId, versionNumber),
      })
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'The curriculum change could not be saved.',
      )
    },
  })

  function run(action: () => Promise<unknown>) {
    mutation.mutate(action)
  }

  async function downloadResource(
    moduleId: number,
    lessonId: number,
    resource: CertificationResource,
  ) {
    try {
      const result = await downloadCertificationResource(
        programmeId,
        versionNumber,
        moduleId,
        lessonId,
        resource.id,
      )
      triggerBrowserDownload(
        result.blob,
        result.filename ?? resource.original_filename ?? 'resource',
      )
      setError(null)
    } catch (downloadError) {
      setError(
        downloadError instanceof ApiClientError
          ? downloadError.message
          : 'The resource file could not be downloaded.',
      )
    }
  }

  const orderedModules = [...modules].sort((a, b) => a.sort_order - b.sort_order)

  function renderResources(module: CertificationModule, lesson: CertificationLesson) {
    const resources = [...(lesson.resources ?? [])].sort((a, b) => a.sort_order - b.sort_order)

    return (
      <ul className="cert-list cert-list--resources">
        {resources.map((resource, index) => {
          const editing =
            openForm?.kind === 'resource-edit' &&
            openForm.resourceId === resource.id &&
            openForm.lessonId === lesson.id

          return (
            <li key={resource.id} className="cert-list__item">
              {editing ? (
                <ResourceForm
                  initial={{
                    type: String(resource.type),
                    title: resource.title,
                    bodyText: resource.body_text ?? '',
                    externalUrl: resource.external_url ?? '',
                  }}
                  submitLabel={mutation.isPending ? 'Saving…' : 'Save resource'}
                  pending={mutation.isPending}
                  onCancel={() => setOpenForm(null)}
                  onSubmit={(body) =>
                    run(() =>
                      updateCertificationResource(
                        programmeId,
                        versionNumber,
                        module.id,
                        lesson.id,
                        resource.id,
                        body,
                      ),
                    )
                  }
                />
              ) : (
                <>
                  <ResourceSummary resource={resource} />
                  <div className="cert-actions">
                    {resource.has_file ? (
                      <Button
                        onClick={() => {
                          void downloadResource(module.id, lesson.id, resource)
                        }}
                      >
                        Download
                      </Button>
                    ) : null}
                    {editable ? (
                      <>
                        <Button
                          onClick={() =>
                            setOpenForm({
                              kind: 'resource-edit',
                              moduleId: module.id,
                              lessonId: lesson.id,
                              resourceId: resource.id,
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={index === 0}
                          aria-label={`Move resource ${resource.title} up`}
                          onClick={() =>
                            run(() =>
                              reorderCertificationResources(
                                programmeId,
                                versionNumber,
                                module.id,
                                lesson.id,
                                moveInOrder(resources, index, -1).map((item) => item.id),
                              ),
                            )
                          }
                        >
                          Up
                        </Button>
                        <Button
                          disabled={index === resources.length - 1}
                          aria-label={`Move resource ${resource.title} down`}
                          onClick={() =>
                            run(() =>
                              reorderCertificationResources(
                                programmeId,
                                versionNumber,
                                module.id,
                                lesson.id,
                                moveInOrder(resources, index, 1).map((item) => item.id),
                              ),
                            )
                          }
                        >
                          Down
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            setPendingConfirm({
                              title: 'Delete resource',
                              description: `"${resource.title}" and any stored file will be removed from this draft version.`,
                              run: () =>
                                deleteCertificationResource(
                                  programmeId,
                                  versionNumber,
                                  module.id,
                                  lesson.id,
                                  resource.id,
                                ),
                            })
                          }
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </li>
          )
        })}

        {resources.length === 0 ? (
          <li className="cert-list__item cert-muted">No resources on this lesson.</li>
        ) : null}

        {editable ? (
          <li className="cert-list__item cert-list__item--form">
            {openForm?.kind === 'resource-create' && openForm.lessonId === lesson.id ? (
              <ResourceForm
                submitLabel={mutation.isPending ? 'Adding…' : 'Add resource'}
                pending={mutation.isPending}
                onCancel={() => setOpenForm(null)}
                onSubmit={(body) =>
                  run(() =>
                    createCertificationResource(
                      programmeId,
                      versionNumber,
                      module.id,
                      lesson.id,
                      body,
                    ),
                  )
                }
              />
            ) : (
              <Button
                onClick={() =>
                  setOpenForm({
                    kind: 'resource-create',
                    moduleId: module.id,
                    lessonId: lesson.id,
                  })
                }
              >
                Add resource
              </Button>
            )}
          </li>
        ) : null}
      </ul>
    )
  }

  function renderLessons(module: CertificationModule) {
    const lessons = [...(module.lessons ?? [])].sort((a, b) => a.sort_order - b.sort_order)

    return (
      <ul className="cert-list">
        {lessons.map((lesson, index) => {
          const editing = openForm?.kind === 'lesson-edit' && openForm.lessonId === lesson.id

          return (
            <li key={lesson.id} className="cert-lesson">
              {editing ? (
                <LessonForm
                  initial={{
                    title: lesson.title,
                    description: lesson.description ?? '',
                    contentType: String(lesson.content_type),
                    isRequired: lesson.is_required,
                  }}
                  submitLabel={mutation.isPending ? 'Saving…' : 'Save lesson'}
                  pending={mutation.isPending}
                  onCancel={() => setOpenForm(null)}
                  onSubmit={(values) =>
                    run(() =>
                      updateCertificationLesson(programmeId, versionNumber, module.id, lesson.id, {
                        title: values.title,
                        description: values.description || null,
                        content_type: values.contentType as CertificationLessonContentType,
                        is_required: values.isRequired,
                      }),
                    )
                  }
                />
              ) : (
                <>
                  <div className="cert-lesson__head">
                    <div className="cert-stack">
                      <span className="cert-primary">{lesson.title}</span>
                      <span className="cert-muted">
                        {formatStatusLabel(String(lesson.content_type))} ·{' '}
                        {lesson.is_required ? 'Required' : 'Optional'}
                      </span>
                      {lesson.description ? (
                        <span className="cert-muted">{lesson.description}</span>
                      ) : null}
                    </div>
                    {editable ? (
                      <div className="cert-actions">
                        <Button
                          onClick={() =>
                            setOpenForm({
                              kind: 'lesson-edit',
                              moduleId: module.id,
                              lessonId: lesson.id,
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={index === 0}
                          aria-label={`Move lesson ${lesson.title} up`}
                          onClick={() =>
                            run(() =>
                              reorderCertificationLessons(
                                programmeId,
                                versionNumber,
                                module.id,
                                moveInOrder(lessons, index, -1).map((item) => item.id),
                              ),
                            )
                          }
                        >
                          Up
                        </Button>
                        <Button
                          disabled={index === lessons.length - 1}
                          aria-label={`Move lesson ${lesson.title} down`}
                          onClick={() =>
                            run(() =>
                              reorderCertificationLessons(
                                programmeId,
                                versionNumber,
                                module.id,
                                moveInOrder(lessons, index, 1).map((item) => item.id),
                              ),
                            )
                          }
                        >
                          Down
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            setPendingConfirm({
                              title: 'Delete lesson',
                              description: `"${lesson.title}" and its resources will be removed from this draft version.`,
                              run: () =>
                                deleteCertificationLesson(
                                  programmeId,
                                  versionNumber,
                                  module.id,
                                  lesson.id,
                                ),
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {renderResources(module, lesson)}
                </>
              )}
            </li>
          )
        })}

        {lessons.length === 0 ? (
          <li className="cert-lesson cert-muted">No lessons in this module.</li>
        ) : null}

        {editable ? (
          <li className="cert-lesson cert-lesson--form">
            {openForm?.kind === 'lesson-create' && openForm.moduleId === module.id ? (
              <LessonForm
                submitLabel={mutation.isPending ? 'Adding…' : 'Add lesson'}
                pending={mutation.isPending}
                onCancel={() => setOpenForm(null)}
                onSubmit={(values) =>
                  run(() =>
                    createCertificationLesson(programmeId, versionNumber, module.id, {
                      title: values.title,
                      description: values.description || null,
                      content_type: values.contentType as CertificationLessonContentType,
                      is_required: values.isRequired,
                    }),
                  )
                }
              />
            ) : (
              <Button onClick={() => setOpenForm({ kind: 'lesson-create', moduleId: module.id })}>
                Add lesson
              </Button>
            )}
          </li>
        ) : null}
      </ul>
    )
  }

  return (
    <section className="cert-panel cert-panel--wide">
      <div className="cert-panel__head">
        <h2>Curriculum</h2>
        {editable && openForm?.kind !== 'module-create' ? (
          <Button variant="primary" onClick={() => setOpenForm({ kind: 'module-create' })}>
            Add module
          </Button>
        ) : null}
      </div>

      {!editable ? (
        <p className="cert-muted">
          Read-only. Curriculum can only be authored while a version is in draft.
        </p>
      ) : null}

      {error ? (
        <Notice tone="danger" title="Curriculum change failed">
          {error}
        </Notice>
      ) : null}

      {editable && openForm?.kind === 'module-create' ? (
        <ModuleForm
          submitLabel={mutation.isPending ? 'Adding…' : 'Add module'}
          pending={mutation.isPending}
          onCancel={() => setOpenForm(null)}
          onSubmit={(values) =>
            run(() =>
              createCertificationModule(programmeId, versionNumber, {
                title: values.title,
                description: values.description || null,
              }),
            )
          }
        />
      ) : null}

      {isLoading ? (
        <p className="cert-muted">Loading curriculum…</p>
      ) : orderedModules.length === 0 ? (
        <EmptyState
          title="No modules yet."
          description={
            editable
              ? 'Add a module to start structuring lessons and resources.'
              : 'This version has no curriculum modules.'
          }
        />
      ) : (
        <ol className="cert-modules">
          {orderedModules.map((module, index) => {
            const editing = openForm?.kind === 'module-edit' && openForm.moduleId === module.id

            return (
              <li key={module.id} className="cert-module">
                {editing ? (
                  <ModuleForm
                    initial={{ title: module.title, description: module.description ?? '' }}
                    submitLabel={mutation.isPending ? 'Saving…' : 'Save module'}
                    pending={mutation.isPending}
                    onCancel={() => setOpenForm(null)}
                    onSubmit={(values) =>
                      run(() =>
                        updateCertificationModule(programmeId, versionNumber, module.id, {
                          title: values.title,
                          description: values.description || null,
                        }),
                      )
                    }
                  />
                ) : (
                  <div className="cert-module__head">
                    <div className="cert-stack">
                      <h3 className="cert-module__title">{module.title}</h3>
                      {module.description ? (
                        <span className="cert-muted">{module.description}</span>
                      ) : null}
                    </div>
                    {editable ? (
                      <div className="cert-actions">
                        <Button
                          onClick={() => setOpenForm({ kind: 'module-edit', moduleId: module.id })}
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={index === 0}
                          aria-label={`Move module ${module.title} up`}
                          onClick={() =>
                            run(() =>
                              reorderCertificationModules(
                                programmeId,
                                versionNumber,
                                moveInOrder(orderedModules, index, -1).map((item) => item.id),
                              ),
                            )
                          }
                        >
                          Up
                        </Button>
                        <Button
                          disabled={index === orderedModules.length - 1}
                          aria-label={`Move module ${module.title} down`}
                          onClick={() =>
                            run(() =>
                              reorderCertificationModules(
                                programmeId,
                                versionNumber,
                                moveInOrder(orderedModules, index, 1).map((item) => item.id),
                              ),
                            )
                          }
                        >
                          Down
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            setPendingConfirm({
                              title: 'Delete module',
                              description: `"${module.title}" and all of its lessons and resources will be removed from this draft version.`,
                              run: () =>
                                deleteCertificationModule(programmeId, versionNumber, module.id),
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}

                {renderLessons(module)}
              </li>
            )
          })}
        </ol>
      )}

      <ConfirmDialog
        open={pendingConfirm != null}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description ?? ''}
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          const confirmed = pendingConfirm
          setPendingConfirm(null)
          if (confirmed) {
            run(confirmed.run)
          }
        }}
      />
    </section>
  )
}
