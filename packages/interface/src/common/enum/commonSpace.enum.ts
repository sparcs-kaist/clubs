// 공용공간을 특정 분류기준을 통해 분류해야할 경우를 대비하여 생성한 열거형입니다.
const CommonSpaceEnum = {
  NotUsed: 0,
} as const;

type CommonSpaceEnum = (typeof CommonSpaceEnum)[keyof typeof CommonSpaceEnum];

const CommonSpaceUsageOrderStatusEnum = {
  Applied: 0, // 신청
  Used: 1, // 사용
  Canceled: 2, // 취소
} as const;

type CommonSpaceUsageOrderStatusEnum =
  (typeof CommonSpaceUsageOrderStatusEnum)[keyof typeof CommonSpaceUsageOrderStatusEnum];

export { CommonSpaceEnum, CommonSpaceUsageOrderStatusEnum };
