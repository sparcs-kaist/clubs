export enum FundingStatusEnum {
  Applied = 1, // 제출
  Approved, // 승인
  Rejected, // 반려
  Committee, // 운위
  Partial, // 부분 승인
}

export enum FundingDeadlineEnum {
  Writing = 1, // 작성
  Late, // 지연 제출기간, writing 기간 종료 후 수정제출 기간 전까지
  Modification, // 수정
  Exception, // 이의 제기
}

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
