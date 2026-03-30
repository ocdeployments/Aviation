// Shared types and utilities
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export function createSuccess<T>(data: T): ApiResponse<T> {
  return { data }
}

export function createError(message: string): ApiResponse {
  return { error: message }
}
