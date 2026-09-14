# TU-494 동아리 등록 진입 및 오류 응답

[Notion Task](https://app.notion.com/p/3dbc25603b0b81db8c5aedb277b75c9f)

## 확정한 신청 조건

DB schema 변경은 없다. 신청 자격의 학기·지위 정책은 기존 규칙을 유지한다.

| 신청 유형 | enum | 자격 | 작성 화면 |
| --- | --- | --- | --- |
| 정동아리 재등록 | Renewal (1) | 현재 대표자·대의원이고 직전 학기 정동아리 | `/register-club/renewal` |
| 정동아리 신규 등록 | Promotional (2) | 현재 대표자·대의원이고 직전 두 학기 모두 가등록이거나, 2학기 전 또는 3학기 전 중 정동아리 이력이 존재 | `/register-club/promotional` |
| 가등록(신규) | NewProvisional (3) | 현재 어느 동아리의 대표자·대의원도 아님 | `/register-club/provisional/new` |
| 가등록(재) | ReProvisional (4) | 현재 대표자·대의원이고 직전 학기 기록 존재. 지위 종류는 제한하지 않음 | `/register-club/provisional/renewal` |

정동아리 지위를 포기하는 동아리도 가등록(재)을 선택할 수 있다. 정동아리 신규 등록의 세부 적합성은 집행부에서 심사한다. 여러 유형이 허용되면 해당 버튼을 모두 활성화한다.

공통 진입 조건은 로그인한 학부생, 등록 신청 기간, 이번 학기 본인 및 대상 동아리의 미삭제 신청 없음이다. 반려된 신청도 중복으로 취급한다. 자격 및 신청 내역 조회 중·실패 상태에서는 서류를 열지 않는다. 직접 URL 접근에도 같은 조건을 적용하고 서버는 제출 시 다시 검증한다.

## 폼과 임시저장

신규/재 가등록은 별도 경로와 고정된 신청 타입을 사용한다. 공통 연락처·활동·지도교수 입력 영역은 재사용한다. 신규 가등록은 새 동아리 이름을 입력하고, 재 가등록은 기존 동아리를 지정한다. 두 유형 모두 지도교수 입력은 선택 사항이다.

임시저장 키는 유형별로 구분한다. 예전 공용 임시저장 데이터는 신청 유형이 맞을 때만 복원한다. 수정 화면은 저장된 신청의 유형과 동아리 ID를 유지하고, 새로운 신청 가능 여부로 기존 서류의 편집을 차단하지 않는다.

## API

### 자격 조회: REG025

`GET /student/registrations/available-clubs`

기존 응답을 사용한다. 성공 응답의 `club: null`은 신규 가등록 대상이다. 기존 동아리는 `club.availableRegistrationTypeEnums`에 포함된 정확한 타입만 허용한다. 데이터가 없거나 조회에 실패한 상태는 `club: null`과 다르게 처리한다.

### 신청 생성: REG001

`POST /student/registrations/club-registrations/club-registration`

기존 입력 항목과 성공 응답 `201 { id: number }`를 유지한다. 선택된 화면이 `registrationTypeEnumId`를 고정한다. 신규 가등록 생성에서는 기존 `clubId`를 보내지 않는다. 활동계획서·회칙 첨부 조건은 해당 유형의 기존 규칙을 따른다.

### 신청 수정: REG009

`PUT /student/registrations/club-registrations/club-registration/{applyId}`

성공 응답은 기존 `200 {}`이다. 생성 완료된 신규 가등록에도 동아리 ID가 있으므로, 신규 신청의 ID 제약과 수정 요청의 ID 제약을 구분한다. 신청자·신청 유형·동아리 일치 여부와 승인 상태를 검증한다.

### 등록 업무 오류

기존 전역 예외 필터가 `HttpException.getResponse()`를 `message`에 담는 형식을 유지한다. 등록 업무 오류는 다음과 같이 안정적인 코드로 구분한다.

```json
{
  "statusCode": 400,
  "message": {
    "code": "ALREADY_CLUB_DELEGATE",
    "message": "현재 다른 동아리의 대표자 또는 대의원이므로 신규 가등록을 신청할 수 없습니다."
  },
  "timestamp": "2026-09-14T00:00:00.000Z",
  "path": "/student/registrations/club-registrations/club-registration"
}
```

| code | 의미 |
| --- | --- |
| REGISTRATION_PERIOD_CLOSED | 신청 기간 아님 |
| CLUB_ALREADY_APPLIED | 해당 동아리의 이번 학기 신청 존재 |
| STUDENT_ALREADY_APPLIED | 본인의 이번 학기 신청 존재 |
| ALREADY_CLUB_DELEGATE | 기존 대표자·대의원이 신규 가등록 시도 |
| NOT_CLUB_DELEGATE | 대상 동아리 대표자·대의원이 아님 |
| NOT_ELIGIBLE | 선택한 등록 유형 자격 미충족 |
| INVALID_REQUEST | 유형과 입력값 불일치 |
| INVALID_CLUB | 유효한 동아리가 아님 |
| MISSING_ATTACHMENT | 필수 첨부 누락 |
| INVALID_ATTACHMENT | 첨부파일 확인 불가 |
| CLUB_NAME_ALREADY_EXISTS | 동일한 국문 또는 영문 이름 존재 |
| APPLICATION_NOT_EDITABLE | 신청이 없거나 수정할 수 없는 상태 |

업무 오류는 기본적으로 `400`이다. 이름 충돌은 `409`, 존재하지 않는 분과와 삭제·누락된 첨부파일은 `404`이다.

일반 입력 스키마 오류는 기존 `400` 응답의 `message` 배열을 유지한다. 프론트는 오류 경로에 대응하는 한국어 입력 항목을 안내한다. 예상하지 못한 응답·서버 오류·통신 오류는 제출 여부가 불명확할 수 있으므로 신청 내역을 확인한 뒤 재시도하도록 안내한다. 서버 원문이나 내부 DB 오류를 사용자에게 그대로 표시하지 않는다.

## 검증 범위

- 네 가지 타입별 버튼과 직접 URL 진입 조건, 조회 중·실패 및 기존 신청의 차단.
- 직전 정동아리의 가등록(재), 기존 정동아리 이력을 이용한 신규 등록 허용 유지.
- 임시저장 유형 혼입 방지와 신규/재 수정 시 타입·동아리 보존.
- 원인별 오류 안내, 입력 항목 안내, 통신 오류의 제출 확인 안내.
- API unit test, 프론트 순수 로직 회귀 테스트, 타입 검사, lint 및 변경된 복합 decision MC/DC.


## 구현 및 검증 결과

- TU-494 작업 트리에서 구현. DB schema 변경 없음.
- 등록 API 관련 Jest 5개 모음, 54개 테스트 통과.
- 최신 dev 병합 후 전체 API Jest 55개 모음, 375개 테스트 및 MC/DC 재검증 통과.
- 프론트 자격·오류·임시저장·기존 내역 이동 19개 테스트 통과.
- 지도교수 없는 재등록 수정 및 선택 취소의 React 폼 동작 검사 통과.
- API production 및 웹 TypeScript 검사 통과. 웹은 기존 테스트 import 규칙에 맞춰 `--allowImportingTsExtensions` 사용.
- 변경한 API·웹·인터페이스 파일 ESLint 통과.
- MC/DC 1개 복합 decision의 조건 2개 모두 독립성 검증 통과.
- 91개 웹 경로 분류 검사 통과.
- transaction, raw SQL, BaseRepository, service DB access, soft-delete 검사 통과.

등록 생성·수정은 서비스의 `@Transactional`과 저장소의 `TransactionHost.tx`를 사용한다. 기존 SQL, 잠금 및 쓰기 조건은 유지했다.

### 남은 저장소 검사

`repository-domain-guard:changed`는 실패한다. 기존 수동 트랜잭션을 정리하면서 위치가 바뀐 `clubDelegateD.findMany/create`, `registration.create/updateMany` 4곳이 `missing-repository-boundary`로 검출된다. 해당 도메인은 아직 boundary 선언이 없다. 전체 변경 규칙 검사는 이 문제 때문에 통과하지 않으며, merge 전에 boundary migration을 정리해야 한다. 사용자 요청에 따라 실패 내역을 공개한 리뷰용 PR을 생성하며, 프로젝트의 예외 절차대로 MC/DC를 별도로 통과시킨 뒤 pre-push 훅을 건너뛴다. 도메인 관계와 schema를 넓게 변경하는 후속 마이그레이션은 이 기능 변경에 포함하지 않았다.

전체 API 테스트 파일까지 포함한 TypeScript 검사에는 기존 club/funding/registration 테스트의 TS2352 오류가 남아 있다. 배포 코드 기준 검사는 통과했다. 실제 브라우저에서 운영 신청을 제출하거나 배포한 것은 아니다.

### 재실행

Node 22.22.1에서 실행한다.

```sh
node --experimental-strip-types --test packages/web/src/features/register-club/utils/*.spec.ts
pnpm --filter api test:unit --runInBand --runTestsByPath src/feature/registration/pipe/registration-request.pipe.spec.ts src/feature/registration/repository/club-registration-application.spec.ts src/feature/registration/service/club-registration-application.spec.ts src/feature/registration/service/registration.service.spec.ts src/feature/registration/util/registration-error.spec.ts
pnpm mcdc:changed --fail-on-missing --test packages/api/src/feature/registration/util/registration-error.spec.ts
pnpm check:diff-line-convention-guards
```
