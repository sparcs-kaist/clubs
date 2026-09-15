# TU-499 SSO 학위 코드 및 추가 학적 로그인

## 코드 매핑

사용자가 제공한 KAIST 코드표를 기준으로 `kaist_v2_info.std_prog_code`를 문자열 그대로 비교한다. 기존 DB 학위 값 1·2·3은 보존한다.

| SSO 문자열 | 코드표 학적 | DB 학위 값 | 프로필 및 JWT type |
| --- | --- | --- | --- |
| `"0"` | 학사과정 | 1 | `undergraduate` |
| `"1"` | 석사과정 | 2 | `master` |
| `"3"` | 전문석사(창업융합) | 2 | `master` |
| `"4"` | 전문석사 | 2 | `master` |
| `"5"` | 박사과정 | 3 | `doctor` |
| `"7"` | 석박사통합과정(박사) | 4 | `masterDoctorDoctor` |
| `"8"` | 석박사통합과정(석사) | 5 | `masterDoctorMaster` |
| `"9"` | 과정전체 | 6 | `allPrograms` |
| `"10"` | 청강생 | 7 | `auditor` |

석박통합 두 단계, 과정전체 및 청강생은 사용자 요청에 따라 각각 독립된 로그인 유형으로 처리한다. 전문석사 두 종류는 석사 프로필을 사용한다. 코드표에 없는 `"2"`를 박사로 판정하던 매핑은 제거한다. 숫자 값이나 공백·선행 0을 포함한 문자열을 정상 SSO 코드로 강제 변환하지 않는다.

## DB 정책

- 학위 정의는 `packages/domain/src/user/student.ts`의 `StudentEnum` const 객체와 `typeof` 기반 union 타입으로 관리한다. interface 패키지는 이 정의를 재export한다.
- `student_t.student_enum`에는 위 표의 정수 값을 저장한다. SSO 판정, 학적 스키마 검증 및 학부생 판정은 코드 상수를 사용한다. enum 테이블에 행을 추가할 필요는 없다.
- 확인한 DB에는 `student_enum`을 참조하는 FK가 없으며 Prisma에도 해당 relation이 없다. `student_t.student_id`의 FK는 유지한다.
- 다른 환경에 `student_t.student_enum → student_enum` FK가 남아 있다면 [조건부 FK 제거 SQL](TU-499-drop-student-enum-fk.sql)을 적용한다. 해당 FK가 없으면 아무것도 변경하지 않는다. 기존 테이블·인덱스·데이터는 유지한다.
- 과거 학위 값 4인 기록 64건(50명)이 있다. 모두 학번 8000대, 2023~2024년 학적이며 현재 유효한 기록은 0건이다. 과거 기록의 의미를 정의한 코드표는 확인하지 못했으며 값을 변경하지 않는다.
- 추가하는 값 5·6·7은 enum 테이블과 학적 테이블에서 사용되지 않았다.

## API 계약

신규 로그인 프로필은 `{ id, number }`를 갖는다. `POST /auth/refresh` 및 사용자 전환 응답의 `accessToken`에 다음 optional 필드를 추가한다.

- `masterDoctorDoctor?: string`
- `masterDoctorMaster?: string`
- `allPrograms?: string`
- `auditor?: string`

각 access JWT는 동일한 이름의 `type`과 `studentId`, `studentNumber`를 포함한다. 기존 응답 필드는 유지한다. 일반 학생 권한과 전화번호 처리는 새 유형에도 적용하고 학부생 전용 권한 및 HP 학번 제한은 유지한다.

## 처리 흐름

1. 표에 있는 SSO 코드를 받으면 현재 유효 학적의 존재 여부와 관계없이 대응하는 학위를 저장한다.
2. 로그인·갱신·사용자 전환에서 DB 학적에 해당하는 프로필과 토큰을 발급한다.
3. 브라우저에서 각 유형의 단독 토큰으로 로그인할 수 있고 프로필 선택과 한국어/영어 표시를 지원한다.
4. 표에 없는 코드와 누락된 코드는 기존의 현재 유효 학적 조회 및 학번 fallback 정책을 따른다. 학번 fallback 구간을 새로 추정하지 않는다.

## 배포

1. [조건부 FK 제거 SQL](TU-499-drop-student-enum-fk.sql)을 적용한다. enum 사전 데이터 INSERT는 필요 없다.
2. 신규 프로필을 인식하는 프론트엔드, API 순서로 배포한다. 이전 API 응답도 새 프론트엔드와 호환된다.
3. 기존 계정은 새 SSO 로그인에서 확인된 학적을 갱신한다. 과거 기록은 일괄 변경하지 않는다.

운영 DB 변경과 배포는 이 작업에서 실행하지 않는다.

## 검증

- 표의 모든 문자열 코드에 대한 학적 저장, 프로필 판정 및 토큰 갱신.
- 현재 유효 학적 없는 최초 로그인과 기존 학적에서 새 유형으로의 갱신.
- 저장된 신규 학위의 토큰 갱신·사용자 전환 보존.
- 학생 기능 및 전화번호 처리 허용, 학부생 전용 기능 차단.
- 신규 유형 단독 토큰 선택, 화면 표시 및 기존 프로필 선택 순서 회귀 검증.
- 실제 MySQL 통합 테스트, API/web 빌드, 변경 코드 가드 및 MC/DC.
- FK 제거 SQL의 FK 존재·부재·재실행, 학생 FK·기존 데이터·인덱스 보존 및 enum 사전 행 없이 신규 학적 저장.

[Notion 작업](https://app.notion.com/p/3dcc25603b0b8175bde2e1183f087d6c)
