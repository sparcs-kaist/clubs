# 물품 대여와 상근일 관리

[Notion Task TU-509](https://app.notion.com/p/416c25603b0b81beb637dcceee5f6a33)

## 데이터

- `office_hour`는 KST 날짜와 버전이 복합 기본 키다. 시간 변경과 휴무 지정은 새 행을 추가하며 캘린더는 날짜별 최신 버전을 조회한다.
- `rental_item`은 품목명, 총수량, 신청 가능 여부와 최대 기간 정책을 저장한다.
- `rental_reservation`은 품목·동아리·신청자 ID와 수령·반납 상근 버전을 참조한다. 수량, 신청에 입력한 연락처와 목적, 확정된 기간 정책과 기본 기한, 상태 및 인도·반납 확인을 저장한다.
- `rental_extension`은 변경 전후 반납 상근 버전, 사유, 집행부 처리자와 시각을 저장한다. 예약의 유효한 연장 참조는 동일 예약의 연장 기록으로 제한한다.

[신규 테이블 생성 SQL](./TU-509-create-rentals.sql)

## API

공유 Zod 계약은 `@clubs/interface/api/office-hours`와 `@clubs/interface/api/rental/v2`에 있다. 날짜는 KST `YYYY-MM-DD`, 시각은 UTC ISO 8601을 사용한다.

| 권한 | API | 동작 |
| --- | --- | --- |
| 공개 | `GET /office-hours?from&to` | 운영 시간과 휴무를 포함한 상근일 목록 |
| 공개 | `GET /rentals/items` | 신청 가능한 품목 목록 |
| 공개 | `GET /rentals/items/:id/return-options?pickupDate=…` | 수령 회차, 반납 후보별 가용 수량과 당일 반납 전 가용 수량 |
| 학생 | `GET /student/rentals/eligible-clubs` | 현재 대표자·대의원으로 신청할 수 있는 동아리 |
| 학생 | `POST /student/rentals` | 동아리, 품목·수량, 수령·반납 날짜와 버전, 전화번호, 목적, 요청 UUID로 예약 확정 |
| 학생 | `GET /student/rentals`, `GET /student/rentals/:id` | 본인 예약 목록·상세 |
| 학생 | `POST /student/rentals/:id/cancel` | 본인 예약을 인도 전에 취소 |
| 집행부 | `GET /executive/office-hours?from&to` | 상근일 관리 목록 |
| 집행부 | `POST /executive/office-hours/generate` | 범위 내 미등록 월~목에 21:00–22:00 일정 생성 |
| 집행부 | `PUT /executive/office-hours/:date` | 해당 날짜의 시간과 휴무 상태 등록·수정 |
| 집행부 | `GET /executive/rental-items`, `POST /executive/rental-items`, `PATCH /executive/rental-items/:id` | 품목 관리 |
| 집행부 | `GET /executive/rentals`, `GET /executive/rentals/:id` | 상태·연체·상근일 조건으로 목록 조회, 인계 메모와 연장 이력 조회 |
| 집행부 | `POST /executive/rentals/:id/checkout`, `POST /executive/rentals/:id/return` | 실제 인도·반납 확인. 인도 메모는 선택 입력 |
| 집행부 | `POST /executive/rentals/:id/cancel`, `POST /executive/rentals/:id/reject` | 인도 전 사유를 기록하고 예약 해제 |
| 집행부 | `PATCH /executive/rentals/:id/schedule` | 수령 전 수령일, 진행 중인 예약의 반납일 조정 |
| 집행부 | `POST /executive/rentals/:id/extend` | 기본 기한을 넘는 연장과 처리자 기록 |

## 규칙

- 이젤은 수령일부터 14일, 다른 품목은 수령 다음에 열리는 두 번째 상근일까지 예약한다. 연장은 기본 한도에서 이젤 14일, 그 외 7일을 더한 범위에서 가능하다.
- 예약은 수령 상근 시작부터 반납 상근 시작 직전까지 재고를 점유한다. 같은 상근의 인도 가능 여부는 반납 확인과 해당 품목의 선행 예약을 반영한다. 연체는 반납 상근 종료 시각부터 표시한다.
- 당일 반납 전 가용 수량을 초과하는 예약이 있으면 해당 수령자와 반납자에게 예약 화면에서 안내한다.
- 휴무나 시간 변경의 영향을 받는 예약은 기존 시간을 표시하고 일정 조정이 필요함을 안내한다.
- 같은 품목에 대한 신청, 재고 수정과 인도·반납은 품목 행을 기준으로 직렬화한다. 동일 요청 UUID의 재시도는 같은 예약을 반환한다.

## 운영 시작

스키마 반영 후 집행부가 실물 수량을 확인해 품목을 등록하고, 공개할 기간의 상근일을 생성한다. 등록된 품목과 상근일을 기준으로 새 신청을 받는다.
