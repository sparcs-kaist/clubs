# TU-498 SSO 로그인 실패 기록

## 목적

SSO 로그인 실패 시 원본 타입을 유지한 학적 입력, 실제로 조회한 학적 정보,
실패 단계와 오류를 DB에 남긴다. 사용자·학적 처리는 User 도메인으로 옮기고,
Auth는 공개 서비스를 통해 로그인 과정을 조합한다.

## 소유권과 호출 경계

- Auth: SSO 통신/검증, 토큰 발급·저장·폐기, 로그인 로그.
- User: 사용자·학생·교수·직원·집행부 조회/갱신 및 학적 판정.
- Semester: 로그인 시점의 학기 조회.
- AuthModule은 UserModule과 SemesterModule을 import한다. User Repository를
  AuthModule의 provider로 직접 등록하지 않는다.
- UserPublicService가 `syncSsoIdentity`, `findLoginIdentity`, `isActiveUser`를
  공개한다. 입력/결과는 User 도메인의 타입이며 Auth나 Prisma 쿼리에 의존하지 않는다.
- SemesterPublicService.loadForLogin은 기존 인증과 동일하게 학기 종료 시각을
  포함한다. 종료 시각을 제외하는 기존 load와 구분한다.

Repository manifest의 `ownedPrismaModels`는 단일 소유권을 선언한다.
`exportedPrismaModels`와 `importedPrismaModels`는 기존 schema relation을
참조하는 계약이다. import의 from은 저장소 기준 manifest 경로이며,
실제 소유자와 공개된 모델을 가드가 검증한다.

import는 타 도메인 모델의 직접 조회·수정 권한을 부여하지 않는다.
외부 relation을 사용하는 include/select/filter/orderBy/count/nested write도
차단한다. 양방향 relation에 따른 메타데이터 순환은 허용하지만,
이를 Nest module import 순환으로 만들지 않는다.

기존 Prisma relation과 FK는 모두 유지한다. schema 변경은 실패 로그 모델 추가뿐이다.

## 트랜잭션과 실패 정보

1. 요청/세션 검증 및 SSO 외부 통신은 DB 트랜잭션 밖에서 처리한다.
2. AuthService.completeSsoSignIn의 `@Transactional()` 안에서 학기 조회,
   사용자·학적 갱신, 토큰 생성을 수행하고 refresh token을 저장한다.
3. User의 내부 서비스도 기본 전파 방식의 `@Transactional()`을 사용하여
   Auth의 트랜잭션에 참여한다. Repository는 TransactionHost.tx를 사용한다.
   unique 충돌(P2002)·트랜잭션 충돌(P2034)은 DB 트랜잭션 전체를 최대 3회
   시도한다. 같은 snapshot에서 쿼리만 재시도하지 않으며 SSO 코드를 다시 교환하지 않는다.
4. UserIdentitySyncError는 원래 오류와 당시 단계·조회 결과를 전달한다.
   Auth는 진단 정보를 수집하고 원래 오류를 다시 던진다.
5. 인터셉터가 예외와 조기 실패 반환을 기록한다. SsoLoginFailureService는
   `@Transactional(Propagation.NotSupported)`로 부모 트랜잭션을 중단하고
   별도 autocommit INSERT를 수행한다. 부모의 롤백과 독립적이다.
6. 로그 INSERT 실패 시 원래 예외/리다이렉트를 유지하고 trace ID·단계·상태만
   서버 로그에 남긴다. DB 장애의 상세 오류는 출력하지 않는다.

## 기록 내용

테이블: `auth_sso_login_failure_log`

- 발생 시각, 서버가 생성한 trace ID, 실패 단계, HTTP 상태.
- 정제한 오류 이름·메시지·stack, 고정 route, 요청 method.
- 가능한 범위의 userId/studentId. FK를 두지 않아 롤백된 사용자도 기록할 수 있다.
- SSO의 학번·과정 코드·사용자 구분·학적 상태 등 허용한 필드.
  값의 존재 여부와 타입을 함께 저장하여 `"1"`, `1`, null, 누락을 구분한다.
- 현재 학번과 연결된 과거 학번, 판정에 사용한 student_t 조회 결과·시점·조건.
- SSO 응답 상태, 파싱 실패 대상, 허용한 통신 오류 코드.
- 요청의 code/state/session 존재 여부, user agent, IP.

code/state 원문, 쿠키, Authorization, 발급 토큰, SSO 서명/secret,
Axios config/request는 저장하지 않는다. 허용된 문자열 안의 비밀값도 정제한다.
JSON 결과는 최대 64 KiB이며 문자열·배열·깊이 제한과 생략 표시를 적용한다.
64K자를 넘는 진단 문자열은 전체 생략하여 과도한 파싱·정제를 피한다.
SSO HTTP 요청에는 60초 timeout을 적용한다.

응답 header `X-SSO-Login-Trace-Id`로 해당 행을 찾을 수 있다.
기존 로그인 API의 응답 body와 리다이렉트 계약은 유지한다.

## DB 적용

`docs/tasks/TU-498-create-sso-login-failure.sql`로 새 테이블만 생성한다.
기존 테이블이나 FK를 변경하는 DDL은 포함하지 않는다.
DateTime은 프로젝트 PrismaService의 UTC↔KST 보정을 그대로 사용한다.

조회 예시:

```sql
SELECT occurred_at, trace_id, stage, http_status, user_id, student_id,
       error_name, error_message, diagnostics
FROM auth_sso_login_failure_log
ORDER BY occurred_at DESC
LIMIT 50;
```

## 검증

- domain guard: 소유권 중복, 미공개/잘못된 import, 외부 모델 직접 쿼리,
  관계 필터·집계·중첩 쓰기 차단과 정상 import.
- 기존 학적 분류, 숫자/문자열 과정 코드, 현재·과거 학번, 삭제 데이터,
  갱신 경쟁, 날짜 보정 및 학기 종료 시각 회귀 테스트.
- 요청 pipe 거부, 세션/SSO 검증·파싱·통신 실패, 학적/JWT/토큰 저장 실패,
  조기 실패 리다이렉트, 로그 INSERT 실패와 비밀값 미저장.
- 실제 MySQL과 Auth/User/Semester 모듈로 성공 commit, 실패 rollback,
  부모 transaction 활성 상태에서 독립 로그 저장, 동시 로그인 검증.
- 전체 변경 가드, MC/DC, lint, API 및 의존 패키지 빌드.

통합 테스트는 `TEST_DATABASE_URL`로 지정한 테스트 DB에서만 실행한다.
각 suite가 같은 DB를 초기화하므로 Jest worker는 하나로 제한한다.

```sh
pnpm build:api
pnpm --filter api test:unit --runInBand --testPathPatterns='feature/auth|login-identity|semester.public.service|semester-login.repository'
pnpm --filter api test:integration --runInBand --testPathPatterns=sso-login-failure
pnpm pre-push:parallel
```
