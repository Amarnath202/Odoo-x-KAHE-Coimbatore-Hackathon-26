import { Response } from 'express';
import dayjs from 'dayjs';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: unknown[];
  timestamp: string;
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Operation successful',
  statusCode: number = 200,
  meta?: Record<string, unknown>,
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: dayjs().toISOString(),
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
}

/**
 * Send a created (201) response
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully',
): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: unknown[],
): void {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
    timestamp: dayjs().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Send a paginated list response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Data retrieved successfully',
): void {
  sendSuccess(
    res,
    data,
    message,
    200,
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  );
}
