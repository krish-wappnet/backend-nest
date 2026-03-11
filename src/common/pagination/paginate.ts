import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from './pagination-query.dto';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function getPaginationParams(
  query?: PaginationQueryDto,
  defaults?: { page?: number; limit?: number },
): { page: number; limit: number; skip: number; take: number } {
  const page = query?.page ?? defaults?.page ?? 1;
  const limit = query?.limit ?? defaults?.limit ?? 20;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
  const cappedLimit = Math.min(safeLimit, 100);

  return {
    page: safePage,
    limit: cappedLimit,
    skip: (safePage - 1) * cappedLimit,
    take: cappedLimit,
  };
}

export async function paginateQueryBuilder<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query?: PaginationQueryDto,
  defaults?: { page?: number; limit?: number },
): Promise<PaginatedResult<T>> {
  const { page, limit, skip, take } = getPaginationParams(query, defaults);

  const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
