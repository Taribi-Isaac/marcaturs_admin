import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}

export function IconButton({
  label,
  className,
  type = 'button',
  children,
  ...props
}: IconButtonProps) {
  const classes = ['ui-icon-button', className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}
