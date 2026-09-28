export const OrderByTypeEnum = {
  ASC: 1,
  DESC: 2,
} as const;

export type OrderByTypeEnum =
  (typeof OrderByTypeEnum)[keyof typeof OrderByTypeEnum];
