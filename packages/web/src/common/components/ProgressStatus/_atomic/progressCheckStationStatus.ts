export enum ProgressCheckSectionStatusEnum {
  Approved, // 체크
  Canceled, // X
  Pending, // 빈 원
}

export interface StatusAndDate {
  status: ProgressCheckSectionStatusEnum;
  date: Date | undefined;
}
