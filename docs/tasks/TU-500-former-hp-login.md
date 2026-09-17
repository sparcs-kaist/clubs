# TU-500: 과거 HP 학번이 연결된 재학생·휴학생 로그인

## 문제와 정책

현재 정규 학번의 학적 판정이 성공해도 연결된 과거 HP 학번의 학위 판정이
실패하면 로그인 트랜잭션 전체가 롤백됐다. 토큰 갱신과 대리 로그인에서도
같은 학생 프로필 조회를 사용해 오류가 재발할 수 있었다.

- 현재 SSO 학번에 대한 필수 검증을 먼저 수행한다. 현재 HP 학번은 계속 차단한다.
- 연결된 HP 학번(끝 네 자리 6900 이상, 7000 미만)은 학생 프로필 구성에서 제외한다.
- HP 학번에 유효한 학적이나 잘못된 학위 enum이 저장되어 있어도 권한을 발급하지 않는다.
- 현재 정규 학번의 재학·휴학을 모두 허용하며, 휴학 상태를 재학으로 바꾸지 않는다.
- 과거 정규 학번의 프로필과 이력 조회, HP 학생/학적 원본 데이터는 보존한다.
- 현재 학적 검증 실패 및 DB 장애는 기존대로 실패 처리한다.

## 변경 범위

공통 HP 판정을 `login-identity-policy.ts`에 두고 현재 SSO 검증 및 연결된
학생 프로필 구성에 사용한다. `syncSsoIdentity`와 `findLoginIdentity`에
같은 제외 기준을 적용한다. 후자는 토큰 갱신과 대리 로그인에서 공통으로 사용한다.
실패 진단의 연결된 학생 목록에는 HP 학번도 남긴다.

이번 변경은 HP 이력으로 인한 로그인 차단을 해결한다. 일반 과거 학적의 권한을
현재 학적과 분리하는 정책 변경이나 모든 연결 학적 오류의 무시는 포함하지 않는다.

## DB / API

- DB 스키마·FK·데이터 마이그레이션 없음.
- SSO callback, 토큰 갱신, 대리 로그인 API의 요청·응답 형식 변경 없음.
- 성공 시 현재 정규 학번의 기존 학위별 토큰을 발급하고 HP 토큰은 발급하지 않는다.

## 검증

- HP 범위의 양쪽 경계와 문자열/숫자 입력을 단위 테스트 및 MC/DC로 확인한다.
- 과거 HP + 현재 재학/휴학, HP 학위 enum 존재 여부, 로그인/갱신을 검증한다.
- 현재 HP 또는 분류할 수 없는 현재 학번이 과거 정규 학번으로 구제되지 않음을 확인한다.
- MySQL 통합 테스트로 현재 첫 학적의 commit, 과거 HP 데이터 보존, 토큰 갱신,
  잘못된 HP 권한 미발급, 실패 로그 및 기존 일반 과거 학위 프로필 유지를 확인한다.
- 테스트는 가상 사용자·학번과 별도 MySQL 테스트 DB를 사용한다.

실행 명령:

```sh
pnpm --filter api test:unit --runInBand --runTestsByPath src/feature/user/service/login-identity-policy.spec.ts src/feature/user/service/user-login-identity.service.spec.ts
pnpm --filter api test:integration --runInBand sso-login-failure.spec.ts
pnpm build:api
pnpm pre-push:parallel
```

통합 테스트에는 이름에 `test`가 포함된 격리된 DB의 `TEST_DATABASE_URL`이 필요하다.
