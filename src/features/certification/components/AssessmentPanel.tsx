import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  createCertificationAssessment,
  createCertificationQuestion,
  deleteCertificationQuestion,
  reorderCertificationQuestions,
  updateCertificationAssessment,
  updateCertificationQuestion,
} from '@/features/certification/api'
import { CERTIFICATION_QUERY_KEYS } from '@/features/certification/constants'
import { formatPassMark } from '@/features/certification/format'
import type { CertificationAssessment, CertificationQuestion } from '@/features/certification/types'
import { Button, ConfirmDialog, EmptyState, Notice, TextAreaField, TextField } from '@/shared/ui'

type OptionDraft = { label: string; isCorrect: boolean }

function AssessmentMetaForm({
  initial,
  submitLabel,
  pending,
  versionPassMark,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; instructions: string }
  submitLabel: string
  pending: boolean
  /** Read-only display of Programme Version pass mark (MH-BE-048). */
  versionPassMark: string | null
  onSubmit: (values: { title: string; instructions: string }) => void
  onCancel: () => void
}) {
  const formId = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')

  return (
    <form
      className="cert-form cert-form--inline"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ title, instructions })
      }}
    >
      <TextField
        id={`${formId}-title`}
        label="Assessment title"
        value={title}
        maxLength={255}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextAreaField
        id={`${formId}-instructions`}
        label="Instructions"
        rows={3}
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
      />
      <p className="cert-muted">
        Pass mark is configured on the programme version ({formatPassMark(versionPassMark)}). It
        cannot be set on the assessment.
      </p>
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

/**
 * Single-choice authoring: exactly one option is flagged correct, matching the
 * backend's only supported question type.
 */
function QuestionForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: { prompt: string; options: OptionDraft[] }
  submitLabel: string
  pending: boolean
  onSubmit: (values: { prompt: string; options: OptionDraft[] }) => void
  onCancel: () => void
}) {
  const formId = useId()
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [options, setOptions] = useState<OptionDraft[]>(
    initial?.options ?? [
      { label: '', isCorrect: true },
      { label: '', isCorrect: false },
    ],
  )
  const [localError, setLocalError] = useState<string | null>(null)

  return (
    <form
      className="cert-form cert-form--inline"
      onSubmit={(event) => {
        event.preventDefault()
        if (options.filter((option) => option.isCorrect).length !== 1) {
          setLocalError('Select exactly one correct option.')
          return
        }
        if (options.some((option) => !option.label.trim())) {
          setLocalError('Every option needs a label.')
          return
        }
        setLocalError(null)
        onSubmit({ prompt, options })
      }}
    >
      <TextAreaField
        id={`${formId}-prompt`}
        label="Question prompt"
        rows={2}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />

      <fieldset className="cert-fieldset">
        <legend>Options</legend>
        {options.map((option, index) => (
          <div key={index} className="cert-option-row">
            <TextField
              id={`${formId}-option-${index}`}
              label={`Option ${index + 1}`}
              value={option.label}
              maxLength={1000}
              onChange={(event) =>
                setOptions((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, label: event.target.value } : item,
                  ),
                )
              }
            />
            <label className="cert-check">
              <input
                type="radio"
                name={`${formId}-correct`}
                checked={option.isCorrect}
                onChange={() =>
                  setOptions((current) =>
                    current.map((item, itemIndex) => ({
                      ...item,
                      isCorrect: itemIndex === index,
                    })),
                  )
                }
              />
              Correct
            </label>
            <Button
              variant="ghost"
              disabled={options.length <= 2}
              aria-label={`Remove option ${index + 1}`}
              onClick={() =>
                setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          onClick={() => setOptions((current) => [...current, { label: '', isCorrect: false }])}
        >
          Add option
        </Button>
      </fieldset>

      {localError ? (
        <p className="field__error" role="alert">
          {localError}
        </p>
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

export type AssessmentPanelProps = {
  programmeId: number
  versionNumber: number
  assessment: CertificationAssessment | null
  isLoading: boolean
  /** Draft version + `certification.manage`. */
  editable: boolean
  /** Programme Version pass mark (sole authority — MH-BE-048). */
  versionPassMark: string | null
}

export function AssessmentPanel({
  programmeId,
  versionNumber,
  assessment,
  isLoading,
  editable,
  versionPassMark,
}: AssessmentPanelProps) {
  const queryClient = useQueryClient()
  const [metaFormOpen, setMetaFormOpen] = useState(false)
  const [questionFormOpen, setQuestionFormOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CertificationQuestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      setError(null)
      setMetaFormOpen(false)
      setQuestionFormOpen(false)
      setEditingQuestionId(null)
      await queryClient.invalidateQueries({
        queryKey: CERTIFICATION_QUERY_KEYS.assessment(programmeId, versionNumber),
      })
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'The assessment change could not be saved.',
      )
    },
  })

  function run(action: () => Promise<unknown>) {
    mutation.mutate(action)
  }

  const questions = [...(assessment?.questions ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section className="cert-panel cert-panel--wide">
      <div className="cert-panel__head">
        <h2>Final assessment</h2>
        {editable && assessment && !metaFormOpen ? (
          <Button variant="secondary" onClick={() => setMetaFormOpen(true)}>
            Edit assessment
          </Button>
        ) : null}
      </div>

      <p className="cert-muted">
        Scoring, passing, and Awards are decided by the server from submitted attempts. This desk
        authors questions only — it cannot mark a learner as passed or award them a certificate.
      </p>

      {!editable ? (
        <p className="cert-muted">
          Read-only. Assessment authoring is only available while a version is in draft.
        </p>
      ) : null}

      {error ? (
        <Notice tone="danger" title="Assessment change failed">
          {error}
        </Notice>
      ) : null}

      {isLoading ? <p className="cert-muted">Loading assessment…</p> : null}

      {!isLoading && !assessment ? (
        editable ? (
          metaFormOpen ? (
            <AssessmentMetaForm
              versionPassMark={versionPassMark}
              submitLabel={mutation.isPending ? 'Creating…' : 'Create assessment'}
              pending={mutation.isPending}
              onCancel={() => setMetaFormOpen(false)}
              onSubmit={(values) =>
                run(() =>
                  createCertificationAssessment(programmeId, versionNumber, {
                    title: values.title,
                    instructions: values.instructions || null,
                  }),
                )
              }
            />
          ) : (
            <EmptyState
              title="No assessment yet."
              description="A version needs an assessment with questions before it can be published."
              actionLabel="Create assessment"
              onAction={() => setMetaFormOpen(true)}
            />
          )
        ) : (
          <EmptyState
            title="No assessment yet."
            description="This version has no final assessment configured."
          />
        )
      ) : null}

      {assessment ? (
        <>
          {metaFormOpen && editable ? (
            <AssessmentMetaForm
              versionPassMark={versionPassMark}
              initial={{
                title: assessment.title,
                instructions: assessment.instructions ?? '',
              }}
              submitLabel={mutation.isPending ? 'Saving…' : 'Save assessment'}
              pending={mutation.isPending}
              onCancel={() => setMetaFormOpen(false)}
              onSubmit={(values) =>
                run(() =>
                  updateCertificationAssessment(programmeId, versionNumber, {
                    title: values.title,
                    instructions: values.instructions || null,
                  }),
                )
              }
            />
          ) : (
            <dl className="cert-dl">
              <div>
                <dt>Title</dt>
                <dd>{assessment.title}</dd>
              </div>
              <div>
                <dt>Pass mark</dt>
                <dd>
                  {formatPassMark(versionPassMark ?? assessment.pass_mark_percent)}
                  <span className="cert-muted"> (from programme version)</span>
                </dd>
              </div>
              <div>
                <dt>Questions</dt>
                <dd>{assessment.question_count ?? questions.length}</dd>
              </div>
              <div className="cert-dl__full">
                <dt>Instructions</dt>
                <dd>{assessment.instructions || '—'}</dd>
              </div>
            </dl>
          )}

          <ol className="cert-questions">
            {questions.map((question, index) => {
              const options = [...(question.options ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order,
              )

              return (
                <li key={question.id} className="cert-question">
                  {editingQuestionId === question.id && editable ? (
                    <QuestionForm
                      initial={{
                        prompt: question.prompt,
                        options: options.map((option) => ({
                          label: option.label,
                          isCorrect: Boolean(option.is_correct),
                        })),
                      }}
                      submitLabel={mutation.isPending ? 'Saving…' : 'Save question'}
                      pending={mutation.isPending}
                      onCancel={() => setEditingQuestionId(null)}
                      onSubmit={(values) =>
                        run(() =>
                          updateCertificationQuestion(programmeId, versionNumber, question.id, {
                            prompt: values.prompt,
                            options: values.options.map((option) => ({
                              label: option.label,
                              is_correct: option.isCorrect,
                            })),
                          }),
                        )
                      }
                    />
                  ) : (
                    <>
                      <div className="cert-question__head">
                        <span className="cert-primary">{question.prompt}</span>
                        {editable ? (
                          <div className="cert-actions">
                            <Button onClick={() => setEditingQuestionId(question.id)}>Edit</Button>
                            <Button
                              disabled={index === 0}
                              aria-label={`Move question ${index + 1} up`}
                              onClick={() => {
                                const ids = questions.map((item) => item.id)
                                const swapped = [...ids]
                                swapped[index] = ids[index - 1]!
                                swapped[index - 1] = ids[index]!
                                run(() =>
                                  reorderCertificationQuestions(
                                    programmeId,
                                    versionNumber,
                                    swapped,
                                  ),
                                )
                              }}
                            >
                              Up
                            </Button>
                            <Button
                              disabled={index === questions.length - 1}
                              aria-label={`Move question ${index + 1} down`}
                              onClick={() => {
                                const ids = questions.map((item) => item.id)
                                const swapped = [...ids]
                                swapped[index] = ids[index + 1]!
                                swapped[index + 1] = ids[index]!
                                run(() =>
                                  reorderCertificationQuestions(
                                    programmeId,
                                    versionNumber,
                                    swapped,
                                  ),
                                )
                              }}
                            >
                              Down
                            </Button>
                            <Button variant="danger" onClick={() => setPendingDelete(question)}>
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <ul className="cert-options">
                        {options.map((option) => (
                          <li key={option.id}>
                            <span>{option.label}</span>
                            {option.is_correct ? (
                              <span className="cert-flag cert-flag--correct">Correct answer</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              )
            })}
          </ol>

          {questions.length === 0 ? (
            <p className="cert-muted">
              No questions yet. A version cannot be published without a scorable assessment.
            </p>
          ) : null}

          {editable ? (
            questionFormOpen ? (
              <QuestionForm
                submitLabel={mutation.isPending ? 'Adding…' : 'Add question'}
                pending={mutation.isPending}
                onCancel={() => setQuestionFormOpen(false)}
                onSubmit={(values) =>
                  run(() =>
                    createCertificationQuestion(programmeId, versionNumber, {
                      prompt: values.prompt,
                      type: 'single_choice',
                      options: values.options.map((option) => ({
                        label: option.label,
                        is_correct: option.isCorrect,
                      })),
                    }),
                  )
                }
              />
            ) : (
              <div className="cert-actions">
                <Button variant="primary" onClick={() => setQuestionFormOpen(true)}>
                  Add question
                </Button>
              </div>
            )
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        open={pendingDelete != null}
        title="Delete question"
        description="The question and its options will be removed from this draft assessment."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const question = pendingDelete
          setPendingDelete(null)
          if (question) {
            run(() => deleteCertificationQuestion(programmeId, versionNumber, question.id))
          }
        }}
      />
    </section>
  )
}
