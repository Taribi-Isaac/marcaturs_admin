import { render, screen, waitFor } from '@testing-library/react'
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

  it('keeps focus inside the dialog when the parent re-renders with new callbacks', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Open confirm' })
    await user.click(trigger)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })
    await user.tab()
    const confirm = screen.getByRole('button', { name: 'Confirm' })
    expect(confirm).toHaveFocus()

    rerender(<DialogHarness />)
    expect(confirm).toHaveFocus()
    await new Promise((resolve) => window.requestAnimationFrame(resolve))
    expect(confirm).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('invokes the latest cancel handler on Escape after a re-render', async () => {
    const staleCancel = vi.fn()
    const latestCancel = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <ConfirmDialog
        open
        title="Confirm action"
        description="Body"
        onCancel={staleCancel}
        onConfirm={() => undefined}
      />,
    )
    rerender(
      <ConfirmDialog
        open
        title="Confirm action"
        description="Body"
        onCancel={latestCancel}
        onConfirm={() => undefined}
      />,
    )

    await user.keyboard('{Escape}')
    expect(latestCancel).toHaveBeenCalledTimes(1)
    expect(staleCancel).not.toHaveBeenCalled()
  })
})
