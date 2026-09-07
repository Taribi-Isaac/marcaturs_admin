import type { RouteObject } from 'react-router-dom'
import { CampaignsPage } from './CampaignsPage'

export const campaignsRoutes: RouteObject[] = [{ path: 'campaigns', element: <CampaignsPage /> }]
