import type { ReactNode } from 'react'

export type NoticeTone = 'info' | 'warning' | 'danger' | 'success'

export type NoticeProps = {
  tone?: NoticeTone
  title: string
  children: ReactNode
}

export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <aside className={`notice notice--${tone}`} role="note">
      <div>
        <div className="notice__title">{title}</div>
        <div className="notice__body">{children}</div>
      </div>
    </aside>
  )
}
