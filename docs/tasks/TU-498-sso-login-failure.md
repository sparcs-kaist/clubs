# TU-498 SSO 로그인 실패 진단 기록

[Notion Task](https://app.notion.com/p/3dcc25603b0b8163aa80f577ea6026bf)

일반 SSO 로그인 실패를 `auth_sso_login_failure_log` 한 테이블에 기록한다.
학적 분류 정책은 유지한다. 집행부 로그인 갈아끼우기 기록인
`auth_exchange_login_log`와 별개이며, 조회 API나 UI는 추가하지 않는다.

## 저장 구조

| 컬럼 | 내용 |
| --- | --- |
| `id` | 자동 증가 PK |
| `occurred_at` | 실패 시각, `DATETIME(3)` |
| `trace_id` | 요청에서 생성한 UUID, 중복 기록 방지용 unique |
| `stage` | 마지막으로 진입한 실패 단계 |
| `http_status` | 예외의 HTTP 상태 또는 조기 실패 분류 상태(400/401) |
| `error_name`, `error_message`, `error_stack` | 인증값을 제거하고 길이를 제한한 오류 정보 |
| `method`, `path` | 요청 메서드와 query string 없는 경로 |
| `user_id`, `student_id` | 실패 시점까지 확인한 식별자, 확인하지 못했으면 NULL |
| `diagnostics` | 타입이 보존된 SSO 진단값, 요청 메타데이터, 실제 조회한 DB 컨텍스트 |

신규 사용자와 사용자/학생 저장 자체의 실패도 기록해야 하므로 사용자·학생 FK는
두지 않는다. 식별자는 오류 당시 값으로 보존하며, 이후 사용자 삭제로 로그를
함께 삭제하지 않는다. 시간 범위, 사용자별 시간 범위, 학생별 시간 범위 인덱스를 둔다.

DB의 `occurred_at`은 기존 `PrismaService` 규칙대로 KST이다. 애플리케이션의
`Date` 객체는 쓰기 시 +9시간, 읽기 시 -9시간 보정된다. JSON 안의 ISO 문자열은
변환 대상이 아니므로 `Z`로 끝나는 조회 시각은 UTC이다.

### 진단 JSON 읽기

`diagnostics`의 형태는 `{ "data": { "request": {}, "sso": {}, "db": {} },
"truncated": [] }`이다. 허용한 필드만 복사하며 각 문자열·배열·중첩 깊이와
전체 기록 크기를 제한한다. 잘린 JSON 경로는 `truncated` 배열에 남는다.
잘린 값을 원문 전체나 완전한 조회 결과로 해석하지 않는다.

문자열은 최대 1,024바이트, 배열은 32개, 객체는 64개 필드, 중첩은 10단계로
제한한다. JSON 이스케이프 후 최종 크기는 64KiB 이하이다. 오류 이름/메시지/스택은
각각 128/4,096/8,192자로 제한하고 잘리면 `[TRUNCATED]`를 붙인다.
응답의 `X-SSO-Login-Trace-Id`가 테이블의 `trace_id`이다. 기존 조기 실패
동작은 오류 화면으로의 302 redirect를 유지하며 실제 응답 상태는
`data.request.responseStatus`에 별도로 기록한다.

SSO 원문은 파싱/보정 전에 `data.sso.profile`로 캡처한다.
`kaist_v2_info.fields`의 `std_no`, `std_prog_code`, `socps_cd`,
`std_status_kor` 등은 `{present, type, value}` 형태로 저장한다.

| 원래 입력 | 저장 형태 |
| --- | --- |
| 숫자 `1` | `{"present":true,"type":"number","value":1}` |
| 문자열 `"1"` | `{"present":true,"type":"string","value":"1"}` |
| `null` | `{"present":true,"type":"null","value":null}` |
| 필드 누락 | `{"present":false,"type":"undefined","omitted":false}` |

허용 필드에 객체·배열이 들어오면 타입과 존재 여부만 남기고 내용을 생략한다.
`kaist_v2_info.type`은 원문 자체가 JSON 문자열이었는지 객체였는지 구분한다.
`state`는 `available`, `missing`, `null`, `parse_failed`, `invalid_shape`를
구분한다. 파싱 실패한 문자열 원문은 인증값이 섞일 수 있어 저장하지 않는다.

`data.sso.profileState`는 응답 미수신(`not_received`), HTTP 오류(`http_error`),
프로필 없음(`missing`), 잘못된 응답 형태(`invalid_shape`), 정상 수신(`available`),
V1/V2 파싱 실패(`v1_parse_failed`/`v2_parse_failed`)를 구분한다.
SSO HTTP 상태는 `data.sso.httpStatus`, 제한된 upstream 오류 코드는
`data.sso.upstreamErrorCode`, 파싱 대상·안전한 오류 이름/메시지는
`data.sso.parseErrors`에서 확인한다. 테이블의 `http_status`는 callback 자체의
실패 상태이므로 upstream 상태와 구분한다.
`parseErrors[].stack`과 `transportErrorStack`은 원본 오류의 호출 프레임을
최대 12개 남기며 `truncated`로 프레임 생략 여부를 표시한다. 인증값을 포함할
수 있는 원본 메시지와 응답 본문·HTTP 설정 객체는 저장하지 않는다.

`data.db.currentStudentTerms`와 `linkedStudentTerms`는 실제 실행한 유효 학적
조회 각각의 `{queriedAt, studentIds, rows}`이다. 조회는
`startTerm <= queriedAt AND (endTerm IS NULL OR endTerm >= queriedAt)
AND deletedAt IS NULL`이며 학기 ID 조건이 없다. `startTerm DESC, id DESC`로
조회하고 학생별 첫 결과를 판별에 사용한다. `rows: []`는 조회 성공 후 결과
없음이며, `rows` 누락은 조회 완료 전 실패와 구분된다.

`rows`에는 기존 조회가 실제로 선택한 `studentId`, `studentEnum`만 보존한다.
`validityFilter`, `orderBy`, `selectedFields`에 적용한 조건·정렬·선택 컬럼을
함께 남긴다. 학적 행의 ID·상태·학기·부서·기간·삭제 시각은 기존 조회 결과에
없으므로 이 기록에서도 확인할 수 없다. 진단용 재조회나 조회 컬럼 확장은 하지
않는다. `db.resolvingStudent.source`가 `current`이면
SSO 현재 학번, `linked`이면 같은 사용자에 연결된 학번을 판별하다 실패한 것이다.
`resolvingStudent.id/number`가 해당 학번이며, 테이블의 `student_id`는 계속
SSO 현재 학생 ID를 가리킨다. `currentStudentResolution`은 현재 학번 판별이
성공해야 생기므로 연결된 다른 학번에서의 후속 실패와 구분할 수 있다.
`resolvingStudent.progCodeV2`, `hasExistingStudentEnum`, `existingStudentEnum`은
판별 함수에 실제로 전달한 값이다. 예를 들어 원본 숫자 `0`은 기존 서비스의
기본값 처리에 의해 판별 시 `null`로 전달될 수 있다.

쿠키, Authorization, 비밀번호, code/state 원문, 액세스/리프레시 토큰,
클라이언트 비밀키 및 서명은 저장하지 않는다. 오류 객체나 HTTP client config를
통째로 직렬화하지 않고, 오류 메시지/스택에도 인증값 제거를 적용한다.
전역 예외 필터도 SSO 요청의 원본 오류를 다시 로그로 남기지 않고 서버 추적 ID,
실패 단계, HTTP 상태만 남긴다.

## 트랜잭션과 ORM 경계

SSO 통신·프로필 검증이 끝난 후 `AuthService.completeSsoSignIn`의
`@Transactional`에서 사용자·학생·학적·교직원·집행부 연결과 refresh token을
함께 저장한다. DB 조회도 같은 트랜잭션을 사용한다. 학적 판별이나 토큰 발급·저장에
실패하면 해당 로그인 변경은 롤백한다. 실패 로그는 인터셉터에서 별도 루트
Prisma 연결로 기록하므로 롤백 이후에도 남는다. 쿠키/redirect 응답 실패는
DB 커밋 이후 발생할 수 있으며 이때도 실패 로그를 기록한다.

기존 raw INSERT를 고유 키 기반 Prisma upsert로 옮겼다. 기존 행의 삭제 상태와
갱신 컬럼을 유지하고, 동시 INSERT의 고유 키 충돌은 같은 키의 update로 처리한다.
직원 테이블은 user/email 고유 키가 없으므로 기존처럼 INSERT한다.
로그아웃의 refresh token 삭제도 서비스 트랜잭션으로 처리한다.

날짜 저장은 기존 `PrismaService`의 UTC↔KST 보정을 사용한다. 과거 raw INSERT는
이 보정을 건너뛰어 읽어 온 학기 경계를 9시간 이르게 저장할 수 있었으나,
ORM으로 저장하는 신규 학생 학적과 교수·직원 기간의 시작일은 이제 DB의 학기
경계와 같은 KST로 저장된다. 기존 학생 학적의 시작·종료일은 upsert 시 변경하지
않는다. 집행부 유효 기간도 서버 시계의 실제 조회 시각을 KST로 변환해 비교한다.

도메인 가드에 따라 사용자 영역과 외부 테이블 사이의 Prisma 탐색 관계를 제거하고
scalar ID로 조회를 조합한다. Overview의 대표자·지도교수·동방 조회와 Funding의
승객 조회도 이에 맞췄다. **이 변경은 Prisma 모델 관계에 한정하며 기존 DB의
외래 키는 삭제하지 않는다.**

## 스키마 적용

기존 [로그인 갈아끼우기 배포 방식](../exchange-login.md#접속-기록과-배포)을 따른다.
`cd-stage.yml`, `cd-demo.yml`은 이미지 배포 webhook을 호출하며 스키마 적용
단계가 없다. **대상 DB에 아래 테이블 DDL을 먼저 적용한 뒤 API를 배포한다.**
이 작업에서는 개발/운영 DB를 변경하지 않았다.

저장소의 `pnpm --filter api prisma:push`는 `DATABASE_URL`의 DB 이름에
별도 단어 `test`가 있는지 검사하는 로컬 테스트용 명령이다. URL을 바꾸거나
운영 배포용 migration을 실행하는 명령이 아니다. 운영/공유 개발 DB에 전체
스키마를 `db push`하지 않는다.

### DB에 연결하지 않고 DDL 검토

Node 22.22.1을 사용하고 TU-498 worktree 루트에서 실행한다.
기준 커밋 `99ecddfd`와의 차이를 생성하므로 원격 브랜치 이동에 영향을 받지 않는다.

```sh
git show 99ecddfd:packages/api/prisma/schema.prisma > /tmp/TU-498-schema-before.prisma
pnpm --filter api exec prisma migrate diff \
  --from-schema-datamodel /tmp/TU-498-schema-before.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/TU-498-full-schema-diff.sql
```

이 명령의 `migrate diff`는 두 스키마 파일만 비교하며 DB에 적용하지 않는다.
전체 diff에는 새 테이블과 함께 ORM 관계 제거에 따른 `DROP FOREIGN KEY`가
포함된다. **전체 diff 파일을 DB에 실행하지 않는다.** 기존 FK는 유지하고,
배포에는 아래와 동일한 테이블 생성 전용
[`TU-498-create-sso-login-failure.sql`](./TU-498-create-sso-login-failure.sql)만 사용한다.

```sql
CREATE TABLE `auth_sso_login_failure_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `occurred_at` DATETIME(3) NOT NULL,
    `trace_id` VARCHAR(36) NOT NULL,
    `stage` VARCHAR(64) NOT NULL,
    `http_status` INTEGER NOT NULL,
    `error_name` VARCHAR(128) NOT NULL,
    `error_message` TEXT NOT NULL,
    `error_stack` TEXT NULL,
    `method` VARCHAR(16) NOT NULL,
    `path` VARCHAR(128) NOT NULL,
    `user_id` INTEGER NULL,
    `student_id` INTEGER NULL,
    `diagnostics` JSON NOT NULL,

    UNIQUE INDEX `auth_sso_login_failure_log_trace_id_key`(`trace_id`),
    INDEX `auth_sso_login_failure_log_occurred_at_idx`(`occurred_at`),
    INDEX `auth_sso_login_failure_log_user_id_occurred_at_idx`(`user_id`, `occurred_at`),
    INDEX `auth_sso_login_failure_log_student_id_occurred_at_idx`(`student_id`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 운영자 적용 예시

운영자가 관리하는 MySQL 연결에서 대상 서버·DB 이름과 기존 테이블 유무를
먼저 확인한다. 비밀번호나 연결 URL을 명령줄/문서에 붙이지 않는다.

```sql
SELECT @@hostname AS server_name, DATABASE() AS database_name;
SHOW TABLES LIKE 'auth_sso_login_failure_log';
```

검토한 `docs/tasks/TU-498-create-sso-login-failure.sql`만 해당 연결에서 실행한다. 다음은 미리 설정한
MySQL login path와 확인한 DB 이름으로 치환해서 사용하는 CLI 예시이다.

```sh
mysql --login-path=TARGET_LOGIN_PATH --database=CONFIRMED_DATABASE < docs/tasks/TU-498-create-sso-login-failure.sql
```

적용 후 `SHOW CREATE TABLE auth_sso_login_failure_log;`로 컬럼·인덱스와
FK가 없는 것을 확인한다. 테이블이 이미 존재하면 `IF NOT EXISTS`로 숨기지 말고
정의를 확인한다. 배포 시 Prisma Client도 함께 생성해야 한다.
테이블 누락이나 DB 오류가 나면 기존 로그인 실패는 그대로 반환되고 DB 진단
기록은 남지 않으므로 서버의 최소 실패 로그를 확인한다.

## 조회와 보존

SQL에서 시간 범위를 지정할 때는 KST를 사용한다.

```sql
SELECT id, occurred_at, trace_id, stage, http_status,
       user_id, student_id, error_name, error_message
FROM auth_sso_login_failure_log
WHERE occurred_at >= '2026-09-15 17:00:00.000'
  AND occurred_at < '2026-09-15 18:00:00.000'
ORDER BY occurred_at DESC;

SELECT trace_id, occurred_at, stage, student_id, diagnostics
FROM auth_sso_login_failure_log
WHERE user_id = 123
  AND occurred_at >= '2026-09-15 00:00:00.000'
ORDER BY occurred_at DESC;
```

학위 코드의 숫자/문자열과 누락/null 구분은 `.value`만 조회하지 말고
`present`와 `type`을 포함한 필드 envelope를 함께 본다.

```sql
SELECT trace_id, stage,
       JSON_EXTRACT(diagnostics, '$.data.sso.profileState') AS profile_state,
       JSON_EXTRACT(diagnostics, '$.data.sso.httpStatus') AS sso_http_status,
       JSON_EXTRACT(diagnostics, '$.data.sso.parseErrors') AS parse_errors,
       JSON_EXTRACT(diagnostics, '$.data.sso.profile.kaist_v2_info.type') AS v2_input_type,
       JSON_EXTRACT(diagnostics, '$.data.sso.profile.kaist_v2_info.state') AS v2_state,
       JSON_EXTRACT(diagnostics, '$.data.sso.profile.kaist_v2_info.fields.std_no') AS std_no,
       JSON_EXTRACT(diagnostics, '$.data.sso.profile.kaist_v2_info.fields.std_prog_code') AS std_prog_code,
       JSON_EXTRACT(diagnostics, '$.data.sso.profile.kaist_v2_info.fields.socps_cd') AS socps_cd,
       JSON_EXTRACT(diagnostics, '$.data.sso.profile.kaist_v2_info.fields.std_status_kor') AS std_status_kor,
       JSON_EXTRACT(diagnostics, '$.truncated') AS truncated_paths
FROM auth_sso_login_failure_log
WHERE trace_id = 'REPLACE_WITH_TRACE_UUID';

SELECT user_id, student_id, stage,
       JSON_EXTRACT(diagnostics, '$.data.db.resolvingStudent') AS failing_student,
       JSON_EXTRACT(diagnostics, '$.data.db.currentStudent') AS current_student,
       JSON_EXTRACT(diagnostics, '$.data.db.currentStudentTerms') AS current_terms,
       JSON_EXTRACT(diagnostics, '$.data.db.currentStudentResolution') AS current_resolution,
       JSON_EXTRACT(diagnostics, '$.data.db.linkedStudents') AS linked_students,
       JSON_EXTRACT(diagnostics, '$.data.db.linkedStudentTerms') AS linked_terms,
       JSON_EXTRACT(diagnostics, '$.truncated') AS truncated_paths
FROM auth_sso_login_failure_log
WHERE trace_id = 'REPLACE_WITH_TRACE_UUID';
```

학번과 학적을 포함하므로 진단 담당자만 조회하고, 원문 전체를 공개 이슈나
Slack에 복사하지 않는다. 자동 정리 작업은 추가하지 않았다. 운영자가 보존
기간을 정하고 만료 데이터를 소량씩 삭제한다. 아래는 **30일 보존을 선택했을
경우에만** 사용하는 예시이며 `UTC_TIMESTAMP() + INTERVAL 9 HOUR`로 KST 기준을
명시한다. 삭제 행 수를 확인하며 반복 실행한다.

```sql
DELETE FROM auth_sso_login_failure_log
WHERE occurred_at < UTC_TIMESTAMP() + INTERVAL 9 HOUR - INTERVAL 30 DAY
ORDER BY occurred_at
LIMIT 1000;
```

## 스키마 검증 결과

- Prisma Client 6.19.2 생성 성공.
- DB 연결 없이 `prisma validate` 성공.
- 기준 스키마의 전체 diff에서 테이블 생성 1개와 ORM 관계 제거에 따른 FK
  삭제 25개를 확인했다. 컬럼·테이블 삭제는 없다. 배포 전용 SQL은 새 테이블
  생성 부분과 일치함을 확인했으며, 전체 diff의 FK 삭제는 DB에 적용하지 않는다.
- 실제 DB DDL 적용과 배포는 수행하지 않았다.

## 구현 검증

- 새 파일을 포함한 `pnpm pre-push:parallel` 전체 단계가 통과했다.
  포맷, web page allowlist, base repository, Prisma raw SQL, repository domain,
  service DB 접근, soft delete, transaction 가드, 전체 lint,
  `pnpm mcdc:changed --fail-on-missing`을 모두 포함한다.
- MC/DC에서 변경된 복합 조건 decision 1개·condition 2개를 모두 검증했다.
  전체 API 단위 테스트와 실제 Nest 트랜잭션 모듈을 사용하는 회귀 테스트가 통과했다.
- `pnpm --filter api build` 및 테스트 파일까지 포함한
  `pnpm --filter api exec tsc --noEmit --incremental false`가 통과했다.
- 로그인 성공 커밋, 학적·서명·refresh token 저장 실패 롤백, 롤백 밖 실패 로그
  1건 기록, SSO 통신 실패 시 DB 트랜잭션 미시작을 검증했다.
- 기존 학적 판별·Overview·Funding 응답, 고유 키 충돌, 실제 Prisma 시간대
  프록시, 로그아웃 삭제 결과, 전역 오류 로그의 SSO 인증값 제외도 검증했다.
- 실제 SSO 계정 로그인과 새 테이블에 대한 실제 DB INSERT는 수행하지 않았다.
  DB DDL 적용·배포·머지도 수행하지 않았다.
