import { createHttpApi } from './httpApi'
import { createMockApi } from './mock/mockApi'
import type { Api } from './types'

export const API_MODE: 'mock' | 'http' = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'

export const api: Api =
  API_MODE === 'http' ? createHttpApi(import.meta.env.VITE_API_URL ?? '/api') : createMockApi()

export { ApiError } from './types'
export type { Api } from './types'
