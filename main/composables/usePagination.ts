export const paginationConfig = {
  defaultPageSize: 10,
  pageSizes: [10, 20, 50, 100],

  limits: {
    videoList: {
      maxPageSize: 50,
      defaultPageSize: 12
    },
    questionList: {
      maxPageSize: 50,
      defaultPageSize: 20
    },
    noticeList: {
      maxPageSize: 20,
      defaultPageSize: 10
    },
    collectList: {
      maxPageSize: 50,
      defaultPageSize: 10
    },
    wrongList: {
      maxPageSize: 50,
      defaultPageSize: 20
    },
    paperList: {
      maxPageSize: 30,
      defaultPageSize: 10
    },
    masteryList: {
      maxPageSize: 50,
      defaultPageSize: 20
    },
    recommendList: {
      maxPageSize: 30,
      defaultPageSize: 10
    },
    scoreList: {
      maxPageSize: 50,
      defaultPageSize: 20
    }
  }
}

export interface PageParams {
  pageNum?: number
  pageSize?: number
  orderByColumn?: string
  isAsc?: string
}

export function normalizePageParams(params: PageParams, type?: string): PageParams {
  const result = { ...params }

  const limitConfig = paginationConfig.limits as Record<string, { maxPageSize: number; defaultPageSize: number }>
  if (type && limitConfig[type]) {
    const limit = limitConfig[type]
    if (result.pageSize && result.pageSize > limit.maxPageSize) {
      result.pageSize = limit.maxPageSize
    }
    if (!result.pageSize) {
      result.pageSize = limit.defaultPageSize
    }
  } else {
    if (result.pageSize && result.pageSize > 100) {
      result.pageSize = 100
    }
    if (!result.pageSize) {
      result.pageSize = paginationConfig.defaultPageSize
    }
  }

  if (!result.pageNum || result.pageNum < 1) {
    result.pageNum = 1
  }

  return result
}

export function buildQueryParams<T extends Record<string, any>>(
  baseParams: T,
  pageParams?: PageParams,
  type?: string
): T & PageParams {
  const normalized = pageParams ? normalizePageParams(pageParams, type) : { pageNum: 1, pageSize: paginationConfig.defaultPageSize }

  return {
    ...baseParams,
    pageNum: normalized.pageNum,
    pageSize: normalized.pageSize,
    orderByColumn: normalized.orderByColumn,
    isAsc: normalized.isAsc
  }
}
