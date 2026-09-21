import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { SUPER_ADMIN_PERMISSIONS } from '@/features/auth/permissions'
import { adminUser, session } from '@/test/msw/handlers'
import { certificationFixtures } from '@/test/msw/certificationHandlers'

function renderApp(initialPath: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

function permissionsWithout(...omitted: string[]) {
  return SUPER_ADMIN_PERMISSIONS.filter((permission) => !omitted.includes(permission))
}

describe('Admin Certification programmes', () => {
  beforeEach(() => {
    session.user = adminUser
  })

  it('redirects staff without certification.view away from programmes', async () => {
    adminUser.permissions = permissionsWithout('certification.view')
    renderApp('/certification/programmes')

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Certification programmes' }),
    ).not.toBeInTheDocument()
  })

  it('hides certification nav entries without the matching permissions', async () => {
    adminUser.permissions = permissionsWithout('certification.view', 'certification.learners.view')
    renderApp('/overview')

    await screen.findByRole('heading', { name: 'Overview' })
    const nav = screen.getByRole('navigation', { name: 'Admin modules' })
    expect(within(nav).queryByRole('link', { name: 'Certification' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Cert. learners' })).not.toBeInTheDocument()
  })

  it('renders the programme list with published version context', async () => {
    renderApp('/certification/programmes')

    expect(
      await screen.findByRole('heading', { name: 'Certification programmes' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Ambassador Professional Foundations')).toBeInTheDocument()
    expect(screen.getByText('Advanced Ambassador Practice')).toBeInTheDocument()
    expect(screen.getByText('Version 1')).toBeInTheDocument()
    expect(screen.getByText('25000.00 NGN')).toBeInTheDocument()
    expect(screen.getByText('No published version')).toBeInTheDocument()
  })

  it('shows an empty state when no programmes exist', async () => {
    certificationFixtures.programmes = []
    renderApp('/certification/programmes')

    expect(await screen.findByText('No certification programmes yet.')).toBeInTheDocument()
  })

  it('surfaces list errors with retry', async () => {
    certificationFixtures.failProgrammes = true
    const user = userEvent.setup()
    renderApp('/certification/programmes')

    expect(await screen.findByText('Unable to load certification programmes')).toBeInTheDocument()
    certificationFixtures.failProgrammes = false
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Ambassador Professional Foundations')).toBeInTheDocument()
  })

  it('shows a forbidden state when the backend denies the list', async () => {
    certificationFixtures.forbidProgrammes = true
    renderApp('/certification/programmes')

    expect(await screen.findByText('Access denied')).toBeInTheDocument()
  })

  it('hides the create programme action without certification.manage', async () => {
    adminUser.permissions = permissionsWithout('certification.manage')
    renderApp('/certification/programmes')

    await screen.findByRole('heading', { name: 'Certification programmes' })
    expect(screen.queryByRole('button', { name: 'Create programme' })).not.toBeInTheDocument()
  })

  it('creates a programme when permitted', async () => {
    const user = userEvent.setup()
    renderApp('/certification/programmes')

    await screen.findByRole('heading', { name: 'Certification programmes' })
    await user.click(screen.getByRole('button', { name: 'Create programme' }))
    await user.type(screen.getByLabelText('Name'), 'Compliance Essentials')
    await user.click(screen.getByRole('button', { name: 'Create programme' }))

    expect(await screen.findByText(/created as a draft/i)).toBeInTheDocument()
    expect(await screen.findByText('Compliance Essentials')).toBeInTheDocument()
  })
})

describe('Admin Certification programme detail', () => {
  beforeEach(() => {
    session.user = adminUser
  })

  it('lists versions, marks the current published one, and notes immutability', async () => {
    renderApp('/certification/programmes/1')

    expect(
      await screen.findByRole('heading', { name: 'Ambassador Professional Foundations' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Published versions are immutable')).toBeInTheDocument()
    expect(screen.getByText(/create a new draft version and publish it/i)).toBeInTheDocument()
    expect(screen.getByText('Version 1')).toBeInTheDocument()
    expect(screen.getByText('Version 2')).toBeInTheDocument()
    expect(screen.getByText('Current published')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Open version' })).toHaveLength(2)
  })

  it('shows not-found for a missing programme', async () => {
    certificationFixtures.missingProgramme = true
    renderApp('/certification/programmes/9999')

    expect(await screen.findByText('Programme not found')).toBeInTheDocument()
  })
})

describe('Admin Certification version detail', () => {
  beforeEach(() => {
    session.user = adminUser
  })

  it('renders published versions read-only with no authoring controls', async () => {
    renderApp('/certification/programmes/1/versions/1')

    expect(await screen.findByText('Read-only version')).toBeInTheDocument()
    expect(screen.getByText(/published and immutable/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Curriculum' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Final assessment' })).toBeInTheDocument()
    expect(await screen.findByText('Professional conduct')).toBeInTheDocument()
    expect(screen.getByText('Disclosure obligations')).toBeInTheDocument()
    expect(await screen.findByText('Foundations final assessment')).toBeInTheDocument()
    expect(screen.getByText('Correct answer')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Add module' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publish version' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit fee and pass mark' })).not.toBeInTheDocument()
  })

  it('allows curriculum authoring and publishing on draft versions', async () => {
    const user = userEvent.setup()
    renderApp('/certification/programmes/1/versions/2')

    expect(await screen.findByText('Draft module')).toBeInTheDocument()
    expect(screen.queryByText('Read-only version')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish version' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add module' }))
    await user.type(screen.getByLabelText('Module title'), 'New draft module')
    await user.click(screen.getByRole('button', { name: 'Add module' }))

    expect(await screen.findByText('New draft module')).toBeInTheDocument()
  })

  it('offers assessment creation when a draft version has none', async () => {
    renderApp('/certification/programmes/1/versions/2')

    expect(await screen.findByText('No assessment yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create assessment' })).toBeInTheDocument()
  })

  it('surfaces the server rejection when publishing an incomplete version', async () => {
    const user = userEvent.setup()
    renderApp('/certification/programmes/1/versions/2')

    await screen.findByText('Draft module')
    await user.click(screen.getByRole('button', { name: 'Publish version' }))
    await user.click(screen.getByRole('button', { name: 'Publish' }))

    expect(
      await screen.findByText(/programme fee must be configured before publishing/i),
    ).toBeInTheDocument()
  })

  it('documents that lesson progress is unavailable', async () => {
    renderApp('/certification/programmes/1/versions/1')

    expect(await screen.findByRole('heading', { name: 'Learner progress' })).toBeInTheDocument()
    expect(screen.getByText(/no Admin lesson-progress API/i)).toBeInTheDocument()
  })
})

describe('Admin Certification learners', () => {
  beforeEach(() => {
    session.user = adminUser
  })

  it('lists enrollments with learner, programme, and payment context', async () => {
    renderApp('/certification/learners')

    expect(
      await screen.findByRole('heading', { name: 'Certification learners' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('#901')).toBeInTheDocument()
    expect(screen.getByText('#902')).toBeInTheDocument()
    expect(screen.getByText('ambassador.ada@demo.marcaturshub.test')).toBeInTheDocument()
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0)
    expect(screen.getByText('No payment record')).toBeInTheDocument()
  })

  it('filters enrollments by the programme_id query param', async () => {
    renderApp('/certification/learners?programme_id=2')

    expect(await screen.findByText('#902')).toBeInTheDocument()
    expect(screen.queryByText('#901')).not.toBeInTheDocument()
  })

  it('redirects staff without certification.learners.view', async () => {
    adminUser.permissions = permissionsWithout('certification.learners.view')
    renderApp('/certification/learners')

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
  })

  it('shows attempts, awards, and pending-PDF certificate messaging', async () => {
    const user = userEvent.setup()
    renderApp('/certification/learners/901')

    expect(await screen.findByRole('heading', { name: 'Enrollment #901' })).toBeInTheDocument()
    expect(screen.getByText('mh_cert_901')).toBeInTheDocument()

    expect(await screen.findByText('Attempt 1')).toBeInTheDocument()
    expect(screen.getByText(/90.00% \(9\/10\)/)).toBeInTheDocument()
    expect(screen.getByText('Passed')).toBeInTheDocument()

    expect(await screen.findByText('Award #1201')).toBeInTheDocument()
    expect(await screen.findByText('MH-CERT-0001301')).toBeInTheDocument()
    expect(
      screen.getByText(/certificate PDF is still generating and is not downloadable yet/i),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Lesson progress' })).toBeInTheDocument()
    expect(screen.getByText(/Progress inspection is deferred/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'View answers' })[0]!)
    expect(await screen.findByText(/Attempt 1 answers/i)).toBeInTheDocument()
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })

  it('reports an empty attempt and award history', async () => {
    renderApp('/certification/learners/902')

    expect(await screen.findByRole('heading', { name: 'Enrollment #902' })).toBeInTheDocument()
    expect(
      await screen.findByText('This learner has not started the final assessment.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('No Award has been earned on this enrollment.'),
    ).toBeInTheDocument()
  })
})

describe('Admin Certification certificate detail', () => {
  beforeEach(() => {
    session.user = adminUser
  })

  it('separates Award, Certificate, and PDF artifact', async () => {
    renderApp('/certification/certificates/1301')

    expect(await screen.findByRole('heading', { name: 'MH-CERT-0001301' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Award (achievement)' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Certificate (issued document)' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'PDF artifact' })).toBeInTheDocument()
    expect(await screen.findByText('#1201')).toBeInTheDocument()
    expect(screen.getAllByText('Ambassador Professional Foundations').length).toBeGreaterThan(0)
    expect(screen.getByText('PDF still generating')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry PDF generation' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument()
  })

  it('offers retry only for failed_retryable artifacts with certification.manage', async () => {
    const user = userEvent.setup()
    renderApp('/certification/certificates/1302')

    expect(await screen.findByText('PDF generation failed')).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: 'Retry PDF generation' })
    await user.click(retry)
    expect(await screen.findByText(/Artifact regeneration requested/i)).toBeInTheDocument()
  })

  it('hides retry without certification.manage', async () => {
    adminUser.permissions = permissionsWithout('certification.manage')
    renderApp('/certification/certificates/1302')

    expect(await screen.findByText('PDF generation failed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry PDF generation' })).not.toBeInTheDocument()
  })

  it('downloads a generated PDF', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    renderApp('/certification/certificates/1303')

    await user.click(await screen.findByRole('button', { name: 'Download PDF' }))
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('shows not-found for an unknown certificate', async () => {
    renderApp('/certification/certificates/999999')

    expect(await screen.findByText('Certificate not found')).toBeInTheDocument()
  })
})
