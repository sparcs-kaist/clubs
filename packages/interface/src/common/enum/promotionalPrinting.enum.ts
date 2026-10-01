const PromotionalPrintingOrderStatusEnum = {
  Applied: 1, // 신청
  Approved: 2, // 승인
  Printed: 3, // 출력완료
  Received: 4, // 수령
} as const;

type PromotionalPrintingOrderStatusEnum =
  (typeof PromotionalPrintingOrderStatusEnum)[keyof typeof PromotionalPrintingOrderStatusEnum];

const PromotionalPrintingSizeEnum = {
  A4: 1,
  A3: 2,
} as const;

type PromotionalPrintingSizeEnum =
  (typeof PromotionalPrintingSizeEnum)[keyof typeof PromotionalPrintingSizeEnum];

export { PromotionalPrintingOrderStatusEnum, PromotionalPrintingSizeEnum };
