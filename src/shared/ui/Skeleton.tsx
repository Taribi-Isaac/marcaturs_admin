import type { HTMLAttributes } from 'react'

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  width?: string | number
  height?: string | number
}

export function Skeleton({
  width = '100%',
  height = '0.9rem',
  style,
  className,
  ...props
}: SkeletonProps) {
  return (
    <span
      className={['skeleton', className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}
