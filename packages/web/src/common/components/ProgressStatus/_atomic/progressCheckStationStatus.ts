export const ProgressCheckSectionStatusEnum = {
  Approved: 0, // 체크
  Canceled: 1, // X
  Pending: 2, // 빈 원
} as const;

export type ProgressCheckSectionStatusEnum =
  (typeof ProgressCheckSectionStatusEnum)[keyof typeof ProgressCheckSectionStatusEnum];

export interface StatusAndDate {
  status: ProgressCheckSectionStatusEnum;
  date: Date | undefined;
}
