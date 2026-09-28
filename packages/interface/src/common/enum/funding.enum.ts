export const FundingStatusEnum = {
  Applied: 1, // 제출
  Approved: 2, // 승인
  Rejected: 3, // 반려
  Committee: 4, // 운위
  Partial: 5, // 부분 승인
} as const;

export type FundingStatusEnum =
  (typeof FundingStatusEnum)[keyof typeof FundingStatusEnum];

// 지원금 기간 종류 - @clubs/domain에서 가져옴
export { FundingDeadlineEnum } from "@clubs/domain/semester/deadline";

export const FixtureEvidenceEnum = {
  Purchase: 1, // 구매
  Management: 2, // 관리
} as const;

export type FixtureEvidenceEnum =
  (typeof FixtureEvidenceEnum)[keyof typeof FixtureEvidenceEnum];

export const FixtureClassEnum = {
  Electronics: 1, // 전자기기
  Furniture: 2, // 가구
  MusicalInstruments: 3, // 악기
  Software: 4, // 소프트웨어
  Others: 5, // 기타
} as const;

export type FixtureClassEnum =
  (typeof FixtureClassEnum)[keyof typeof FixtureClassEnum];

export const TransportationEnum = {
  CityBus: 1, // 시내/마을버스
  IntercityBus: 2, // 고속/시외버스
  Rail: 3, // 철도
  Taxi: 4, // 택시
  CharterBus: 5, // 전세버스
  Cargo: 6, // 화물 운반
  CallVan: 7, // 콜밴
  Airplane: 8, // 비행기
  Ship: 9, // 선박
  Others: 10, // 기타
} as const;

export type TransportationEnum =
  (typeof TransportationEnum)[keyof typeof TransportationEnum];
