import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  )
}

export type UseDialogAccessibilityOptions = {
  open: boolean
  containerRef: RefObject<HTMLElement | null>
  initialFocusRef?: RefObject<HTMLElement | null>
  onEscape?: () => void
  escapeEnabled?: boolean
}

/**
 * Focus management for Admin dialogs: initial focus, Tab trap, Escape, restore.
 */
export function useDialogAccessibility({
  open,
  containerRef,
  initialFocusRef,
  onEscape,
  escapeEnabled = true,
}: UseDialogAccessibilityOptions): void {
  useEffect(() => {
    if (!open) {
      return
    }

    const previous = document.activeElement
    const container = containerRef.current

    const focusInitial = () => {
      const target = initialFocusRef?.current ?? getFocusable(container ?? document.body)[0]
      target?.focus()
    }

    // Defer one frame so dialog content is mounted.
    const frame = window.requestAnimationFrame(focusInitial)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && escapeEnabled) {
        event.preventDefault()
        onEscape?.()
        return
      }

      if (event.key !== 'Tab' || !container) {
        return
      }

      const focusable = getFocusable(container)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last || !container.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      if (previous instanceof HTMLElement) {
        previous.focus()
      }
    }
  }, [open, containerRef, initialFocusRef, onEscape, escapeEnabled])
}
