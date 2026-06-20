import { Request } from 'express';

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parse and validate pagination query params from the request.
 * Defaults: page=1, limit=20, max limit=100
 */
export function parsePagination(req: Request): ParsedPagination {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build pagination meta object for response
 */
export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  };
}
