import { useNavigate } from 'react-router-dom'
import { Button, NotFoundState } from '@/shared/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <NotFoundState
      title="Page not found"
      description="That Admin route does not exist in the Phase-1 navigation."
      action={
        <Button variant="secondary" onClick={() => navigate('/overview')}>
          Back to Overview
        </Button>
      }
    />
  )
}
