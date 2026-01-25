export enum FundingStatusEnum {
  Applied = 1, // 제출
  Approved, // 승인
  Rejected, // 반려
  Committee, // 운위
  Partial, // 부분 승인
}

// 지원금 기간 종류 - @clubs/domain에서 가져옴
export { FundingDeadlineEnum } from "@clubs/domain/semester/deadline";

export enum FixtureEvidenceEnum {
  Purchase = 1, // 구매
  Management, // 관리
}

export enum FixtureClassEnum {
  Electronics = 1, // 전자기기
  Furniture, // 가구
  MusicalInstruments, // 악기
  Software, // 소프트웨어
  Others, // 기타
}

export enum TransportationEnum {
  CityBus = 1, // 시내/마을버스
  IntercityBus, // 고속/시외버스
  Rail, // 철도
  Taxi, // 택시
  CharterBus, // 전세버스
  Cargo, // 화물 운반
  CallVan, // 콜밴
  Airplane, // 비행기
  Ship, // 선박
  Others, // 기타
}
