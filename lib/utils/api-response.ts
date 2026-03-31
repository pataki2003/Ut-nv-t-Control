import { NextResponse } from 'next/server';

import type { ApiError, ApiSuccess } from '@/lib/types/api';

export function successResponse<T>(
  data: T,
  message?: string,
  init?: ResponseInit
) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    init
  );
}

export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json<ApiError>(
    {
      success: false,
      error: {
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}
