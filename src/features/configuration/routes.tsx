import type { RouteObject } from 'react-router-dom'
import { CategoriesConfigPage } from './CategoriesConfigPage'
import { DisputeCategoriesConfigPage } from './DisputeCategoriesConfigPage'
import { ExtensionPackagesConfigPage } from './ExtensionPackagesConfigPage'
import { FeaturedPackagesConfigPage } from './FeaturedPackagesConfigPage'

export const configurationRoutes: RouteObject[] = [
  { path: 'configuration/categories', element: <CategoriesConfigPage /> },
  { path: 'configuration/extension-packages', element: <ExtensionPackagesConfigPage /> },
  { path: 'configuration/featured-packages', element: <FeaturedPackagesConfigPage /> },
  { path: 'configuration/dispute-categories', element: <DisputeCategoriesConfigPage /> },
]
