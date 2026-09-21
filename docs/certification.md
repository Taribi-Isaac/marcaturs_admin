# Admin Certification Operations Console (MH-FE-CERT-03)

Native Admin UI over the existing MH-BE-CERT Admin APIs. It adds no product rules: every
eligibility, scoring, award, and issuance decision stays on the server.

## Permissions

Mirrors the backend `AdminPermissionMatrix` exactly — the console never invents a permission.

| Permission                    | Grants                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `certification.view`          | Programme list/detail, version detail, curriculum, assessment (read)                     |
| `certification.manage`        | All certification mutations (programme, version, curriculum, assessment, artifact retry) |
| `certification.learners.view` | Enrollments, attempts, awards, certificates, certificate PDF download                    |

Roles: `SUPER_ADMIN` and `OPERATIONS` hold all three. `VERIFICATION` and `MODERATION` hold none.

Route gating uses the _view_ permissions only; `certification.manage` gates controls inside a page
so that read-only staff still get a usable surface. The backend remains authoritative — a UI-visible
control can still be rejected with 403.

## Navigation and routes

Two ops-section nav entries: **Certification** (`/certification/programmes`) and
**Cert. learners** (`/certification/learners`).

| Route                                                            | Permission                    | Screen                                                         |
| ---------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `/certification/programmes`                                      | `certification.view`          | Programme list, create programme                               |
| `/certification/programmes/:programmeId`                         | `certification.view`          | Metadata, archive/restore, version table, create version       |
| `/certification/programmes/:programmeId/versions/:versionNumber` | `certification.view`          | Version commercials, publish/unpublish, curriculum, assessment |
| `/certification/learners`                                        | `certification.learners.view` | Enrollment list, `programme_id` filter                         |
| `/certification/learners/:enrollmentId`                          | `certification.learners.view` | Enrollment, payment snapshot, attempts, awards, certificates   |
| `/certification/certificates/:certificateId`                     | `certification.learners.view` | Award vs Certificate vs PDF artifact, download, retry          |

Version URLs use `version_number`, not the version id: `CertificationProgrammeVersion` binds on
`version_number` as its route key.

## Immutability model

- **Draft version** — fee, **pass mark** (sole authority), curriculum (modules/lessons/resources), and assessment title/questions
  - Pass mark is edited on the version commercials form only; the assessment panel shows it read-only (MH-BE-048).
  (questions/options/order) are all editable with `certification.manage`.
- **Published version** — frozen. The page shows a read-only banner, hides all authoring controls,
  and offers only _Unpublish_ (and only for the programme's current published version).
- **Unpublished version** — frozen and terminal. It cannot be edited or re-published; changing
  delivered content requires a new draft version.

The console never presents published content as freely editable. Where the backend would answer
409 (`Published and unpublished programme versions are immutable`), the control is absent rather
than failing after the click.

## Intentionally unavailable actions

These gaps are deliberate, not missing work:

- **No manual award and no manual pass.** Awards are created by the server when it accepts a
  passing attempt. There is no endpoint to grant an award or override an attempt's outcome.
- **No certificate revocation.** The backend exposes no revocation endpoint, so certificates
  cannot be withdrawn from this console.
- **No lesson-progress inspection.** There is no Admin lesson-progress API. Per-lesson completion
  cannot be read or overridden here, and the console does not invent a progress UI. Progress
  inspection is deferred; the version and learner pages state this explicitly.
- **No enrollment creation or cancellation.** Enrollments activate on confirmed payment through
  the Ambassador purchase flow.
- **No fee refunds.** Certification fees are platform payments handled outside this desk.

## Privacy and payment boundaries

- Resource and certificate files are streamed through authorized endpoints. The console receives
  `has_file` / `artifact_available` only — never a disk name, storage path, or signed URL.
- A missing or pending PDF never means the certification is missing. The certificate page separates
  the Award (achievement), the Certificate (issued document), and the PDF artifact, so
  `pending_generation` reads as "queued", not "invalid".
- `artifact_status: failed_retryable` offers _Retry PDF generation_, and only with
  `certification.manage`. The underlying Award and Certificate remain valid.
- The enrollment payment snapshot is a platform certification fee — not a customer payment and not
  an Ambassador commission.

## Multipart uploads

Downloadable lesson resources need a file, so resource create/update send `FormData`. The shared
`apiRequest` passes a `FormData` body through untouched so fetch can set the multipart boundary;
JSON bodies are unaffected. Resource _update_ is a POST (not PATCH) because the backend accepts the
replacement file on POST.

## Tests

`src/features/certification/certification.test.tsx` renders the real `AppRouter` through
`AppProviders` + `MemoryRouter` against `src/test/msw/certificationHandlers.ts`. Coverage includes
permission redirects, nav visibility, programme list/empty/error/forbidden states, programme detail
immutability messaging, draft-only authoring, publish rejection when fee/pass mark are missing,
learner list and `programme_id` filtering, attempt/award/pending-PDF messaging, and retry
visibility gated on both `failed_retryable` and `certification.manage`.

## Browser UAT

`scripts/mh-fe-cert-03-uat.mjs` drives a real browser at desktop 1280×800 and mobile 390×844.
It is a one-off check, not part of CI.
