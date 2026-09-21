/**
 * One-off real-browser UAT for MH-FE-CERT-03 Admin Certification console (not part of CI).
 * Usage: node scripts/mh-fe-cert-03-uat.mjs
 *
 * Requires the Vite dev server on :5174 and the Laravel backend on :8000 with demo data seeded.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.MH_UAT_BASE_URL ?? 'http://localhost:5174'
const EMAIL = process.env.MH_UAT_EMAIL ?? 'admin.primary@demo.marcaturshub.test'
const PASSWORD = process.env.MH_UAT_PASSWORD ?? 'DemoPass123!'
const outDir = path.resolve('tmp/mh-fe-cert-03-uat')
fs.mkdirSync(outDir, { recursive: true })

const report = []

function note(section, ok, detail) {
  report.push({ section, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} [${section}] ${detail}`)
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true })
}

async function goto(page, url) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
}

async function assertNoHScroll(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  const ok = overflow.scrollWidth <= overflow.clientWidth + 1
  note(label, ok, ok ? 'no horizontal overflow' : JSON.stringify(overflow))
}

async function login(page) {
  await goto(page, '/login')
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/password/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
  // The shell mounts after the auth bootstrap resolves, so wait for the nav itself.
  await page.waitForSelector('nav[aria-label="Admin modules"]', { timeout: 20000 })
}

/** Reads the first programme id from the programmes table "Open" links. */
async function firstProgrammeId(page) {
  const href = await page
    .getByRole('link', { name: 'Open' })
    .first()
    .getAttribute('href')
    .catch(() => null)
  const match = href ? /\/certification\/programmes\/(\d+)/.exec(href) : null
  return match ? Number(match[1]) : null
}

async function runViewport(browser, viewport, label) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()

  const hits = new Map()
  const serverErrors = []
  page.on('request', (req) => {
    const url = req.url()
    if (!url.includes('/api/v1/admin/certification')) return
    hits.set(url, (hits.get(url) ?? 0) + 1)
  })
  page.on('response', (res) => {
    if (res.url().includes('/api/v1/admin/certification') && res.status() >= 500) {
      serverErrors.push(`${res.status()} ${res.url()}`)
    }
  })

  await login(page)
  note(`${label}/login`, !page.url().includes('/login'), `landed ${page.url()}`)

  // Nav entries. The sidebar is off-canvas on narrow viewports, so open the drawer first.
  const menuButton = page.locator('.app-shell__menu-button[aria-label="Open navigation"]')
  if (await menuButton.isVisible()) {
    await menuButton.click()
  }
  const nav = page.getByRole('navigation', { name: 'Admin modules' })
  const navCert = await nav.getByRole('link', { name: 'Certification' }).isVisible()
  const navLearners = await nav.getByRole('link', { name: 'Cert. learners' }).isVisible()
  note(`${label}/nav`, navCert && navLearners, `certification=${navCert} learners=${navLearners}`)
  // No need to close the drawer: every later step does a full page load, which resets it.

  // Programmes list
  await goto(page, '/certification/programmes')
  const programmesHeading = await page
    .getByRole('heading', { name: 'Certification programmes', level: 1 })
    .isVisible()
  const createVisible = await page
    .getByRole('button', { name: 'Create programme' })
    .isVisible()
    .catch(() => false)
  note(
    `${label}/programmes`,
    programmesHeading,
    `heading=${programmesHeading} create=${createVisible}`,
  )
  await assertNoHScroll(page, `${label}/programmes-overflow`)
  await shot(page, `${label}-programmes`)

  const programmeId = await firstProgrammeId(page)
  note(`${label}/programme-link`, programmeId != null, `first programme id=${programmeId}`)

  // Programme detail
  if (programmeId != null) {
    await goto(page, `/certification/programmes/${programmeId}`)
    const immutableNote = await page.getByText('Published versions are immutable').isVisible()
    const versionsHeading = await page
      .getByRole('heading', { name: 'Versions', level: 2 })
      .isVisible()
    note(
      `${label}/programme-detail`,
      immutableNote && versionsHeading,
      `immutability=${immutableNote} versions=${versionsHeading}`,
    )
    await assertNoHScroll(page, `${label}/programme-detail-overflow`)
    await shot(page, `${label}-programme-detail`)

    // Version detail — follow the first "Open version" link.
    const versionHref = await page
      .getByRole('link', { name: 'Open version' })
      .first()
      .getAttribute('href')
      .catch(() => null)

    if (versionHref) {
      await goto(page, versionHref)
      const curriculum = await page
        .getByRole('heading', { name: 'Curriculum', level: 2 })
        .isVisible()
      const assessment = await page
        .getByRole('heading', { name: 'Final assessment', level: 2 })
        .isVisible()
      const readOnly = await page
        .getByText('Read-only version')
        .isVisible()
        .catch(() => false)
      const authoring = await page
        .getByRole('button', { name: 'Add module' })
        .isVisible()
        .catch(() => false)
      // A version is either read-only (published/unpublished) or authorable (draft), never both.
      const immutabilityConsistent = readOnly !== authoring
      note(
        `${label}/version-detail`,
        curriculum && assessment && immutabilityConsistent,
        `curriculum=${curriculum} assessment=${assessment} readOnly=${readOnly} authoring=${authoring}`,
      )
      const progressNote = await page
        .getByText(/no Admin lesson-progress API/i)
        .isVisible()
        .catch(() => false)
      note(`${label}/version-progress-note`, progressNote, 'lesson-progress deferral documented')
      await assertNoHScroll(page, `${label}/version-detail-overflow`)
      await shot(page, `${label}-version-detail`)
    } else {
      note(`${label}/version-detail`, false, 'no version link on programme detail')
    }
  }

  // Learners
  await goto(page, '/certification/learners')
  const learnersHeading = await page
    .getByRole('heading', { name: 'Certification learners', level: 1 })
    .isVisible()
  const noManualEnroll =
    (await page.getByRole('button', { name: /enroll|mark passed|award/i }).count()) === 0
  note(
    `${label}/learners`,
    learnersHeading && noManualEnroll,
    `heading=${learnersHeading} noManualActions=${noManualEnroll}`,
  )
  await assertNoHScroll(page, `${label}/learners-overflow`)
  await shot(page, `${label}-learners`)

  const learnerHref = await page
    .getByRole('link', { name: 'Open' })
    .first()
    .getAttribute('href')
    .catch(() => null)

  if (learnerHref) {
    await goto(page, learnerHref)
    const attempts = await page
      .getByRole('heading', { name: 'Assessment attempts', level: 2 })
      .isVisible()
    const awards = await page.getByRole('heading', { name: 'Awards', level: 2 }).isVisible()
    const certificates = await page
      .getByRole('heading', { name: 'Certificates', level: 2 })
      .isVisible()
    const progressDeferred = await page
      .getByText(/Progress inspection is deferred/i)
      .isVisible()
      .catch(() => false)
    note(
      `${label}/learner-detail`,
      attempts && awards && certificates && progressDeferred,
      `attempts=${attempts} awards=${awards} certificates=${certificates} progressDeferred=${progressDeferred}`,
    )
    await assertNoHScroll(page, `${label}/learner-detail-overflow`)
    await shot(page, `${label}-learner-detail`)

    // Certificate detail — only if the learner has an issued certificate.
    const certHref = await page
      .getByRole('link', { name: 'Open certificate' })
      .first()
      .getAttribute('href')
      .catch(() => null)

    if (certHref) {
      await goto(page, certHref)
      const awardPanel = await page
        .getByRole('heading', { name: 'Award (achievement)', level: 2 })
        .isVisible()
      const certPanel = await page
        .getByRole('heading', { name: 'Certificate (issued document)', level: 2 })
        .isVisible()
      const artifactPanel = await page
        .getByRole('heading', { name: 'PDF artifact', level: 2 })
        .isVisible()
      const noRevoke = (await page.getByRole('button', { name: /revoke/i }).count()) === 0
      note(
        `${label}/certificate-detail`,
        awardPanel && certPanel && artifactPanel && noRevoke,
        `award=${awardPanel} certificate=${certPanel} artifact=${artifactPanel} noRevoke=${noRevoke}`,
      )

      const downloadable = await page
        .getByRole('button', { name: 'Download PDF' })
        .isVisible()
        .catch(() => false)
      const retryable = await page
        .getByRole('button', { name: 'Retry PDF generation' })
        .isVisible()
        .catch(() => false)
      const pendingCopy = await page
        .getByText('PDF still generating')
        .isVisible()
        .catch(() => false)
      // Retry is offered only for failed_retryable; download only when a PDF exists.
      note(
        `${label}/certificate-artifact`,
        !(downloadable && retryable),
        `download=${downloadable} retry=${retryable} pending=${pendingCopy}`,
      )
      await assertNoHScroll(page, `${label}/certificate-detail-overflow`)
      await shot(page, `${label}-certificate-detail`)
    } else {
      note(
        `${label}/certificate-detail`,
        true,
        'no issued certificate on this enrollment (skipped)',
      )
    }
  } else {
    note(`${label}/learner-detail`, false, 'no enrollment rows to open')
  }

  note(
    `${label}/server-errors`,
    serverErrors.length === 0,
    serverErrors.length ? serverErrors.slice(0, 5).join(' | ') : 'no 5xx from certification APIs',
  )

  const hot = [...hits.entries()].filter(([, count]) => count > 12)
  note(
    `${label}/network`,
    hot.length === 0,
    hot.length
      ? `hot endpoints: ${JSON.stringify(hot.slice(0, 5))}`
      : `tracked ${hits.size} certification URLs`,
  )

  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runViewport(browser, { width: 1280, height: 800 }, 'desktop')
  await runViewport(browser, { width: 390, height: 844 }, 'mobile')
} finally {
  await browser.close()
}

const failed = report.filter((entry) => !entry.ok)
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(`\nWrote ${outDir}/report.json — ${failed.length} failure(s)`)
process.exit(failed.length ? 1 : 0)
