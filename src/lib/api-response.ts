import { NextResponse } from 'next/server'

interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  error: {
    code: string
    message: string
    details?: any
  } | null
  meta?: {
    page?: number
    limit?: number
    total?: number
    [key: string]: any
  }
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta,
    },
    { status }
  )
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  )
}

// Common error responses
export const ApiErrors = {
  UNAUTHORIZED: () => errorResponse('UNAUTHORIZED', 'Authentication required', 401),
  FORBIDDEN: () => errorResponse('FORBIDDEN', 'Access denied', 403),
  NOT_FOUND: (resource = 'Resource') => errorResponse('NOT_FOUND', `${resource} not found`, 404),
  VALIDATION_ERROR: (message: string, details?: any) => 
    errorResponse('VALIDATION_ERROR', message, 400, details),
  BAD_REQUEST: (message: string, details?: any) => 
    errorResponse('BAD_REQUEST', message, 400, details),
  SERVER_ERROR: (message = 'Internal server error') => 
    errorResponse('SERVER_ERROR', message, 500),
  RATE_LIMIT: () => errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests', 429),
}