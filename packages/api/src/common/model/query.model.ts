/**
 * 필터 조건의 연산자 타입
 */
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "like"
  | "isNull"
  | "isNotNull";

/**
 * 정렬 방향 타입
 */
export type SortOrder = "asc" | "desc";

/**
 * 필터 값 타입
 */
export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | Array<string | number | boolean | Date>;

/**
 * 필터 조건 타입
 */
export type FilterCondition<T> = {
  field: keyof T;
  operator: FilterOperator;
  value?: FilterValue; // isNull, isNotNull의 경우 value 필요 없음
};

/**
 * 정렬 조건 타입
 */
export type SortCondition<T> = {
  field: keyof T;
  order: SortOrder;
};

/**
 * 쿼리 옵션 타입
 */
export type QueryOptions<T> = {
  filters?: FilterCondition<T>[];
  sort?: SortCondition<T>[];
  limit?: number;
  offset?: number;
};
