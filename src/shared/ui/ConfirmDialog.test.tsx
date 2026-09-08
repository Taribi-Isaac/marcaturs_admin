import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/Button'

function DialogHarness() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open confirm</Button>
      <ConfirmDialog
        open={open}
        title="Confirm action"
        description="This is a consequential confirmation."
        confirmLabel="Confirm"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  )
}

describe('ConfirmDialog accessibility', () => {
  it('focuses cancel on open, traps tab, and restores focus on close', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    const trigger = screen.getByRole('button', { name: 'Open confirm' })
    await user.click(trigger)

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('invokes cancel when Escape is pressed', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        open
        title="Confirm action"
        description="Body"
        onCancel={onCancel}
        onConfirm={() => undefined}
      />,
    )

    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
  })
})
