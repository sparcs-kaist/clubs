# TU-492: 로그인 갈아끼우기

[Notion Task](https://www.notion.so/3dac25603b0b81f3bb27c2a05f42af3e)

집행부 대시보드 맨 아래의 **로그인 갈아끼우기** 링크로
`/executive/exchange-login`에 진입한다. 검색 결과에서 계정을 선택하면
그 계정의 권한으로 로그인한다. 복귀는 로그아웃 후 SPARCS SSO 로그인으로 한다.

## API

두 API 모두 executive access token과 현재 집행부 자격이 필요하다.
교체 로그인 중 다시 교체할 때도 최초 실행자의 집행부 자격을 확인한다.

### GET /executive/auth/exchange-login/users

| Query | 형식 |
| --- | --- |
| `type` | `email`, `studentId`, `studentNumber`, `professorId` |
| `value` | 이메일 또는 1 이상 2147483647 이하의 정수 문자열 |

이메일은 사용자·학생·교수·직원·집행부 프로필에서 정확 일치로 검색한다.
결과는 `userId` 기준으로 중복을 제거한다. 삭제된 계정과 사용자 계정이
연결되지 않은 프로필은 결과에서 제외한다.

200 응답:

```json
{
  "users": [
    {
      "userId": 2,
      "name": "대상 사용자",
      "email": "target@kaist.ac.kr",
      "students": [{ "studentId": 10, "studentNumber": 20201234 }],
      "professors": []
    }
  ]
}
```

빈 검색 결과는 `{"users": []}`이다. 사용자 ID 직접 입력은 제공하지 않는다.

### POST /executive/auth/exchange-login

요청: `{"userId": 2}`. 선택한 사용자 계정의 ID만 전달한다.

201 응답은 기존 `/auth/refresh`의 access token 묶음과 동일하다.
`undergraduate`, `master`, `doctor`, `masterDoctor`, `executive`, `professor`, `employee` 중
대상 계정에 해당하는 프로필 토큰을 반환한다.

대상 refresh token은 HttpOnly 쿠키의 `/auth/refresh`, `/auth/sign-out`
두 경로에 설정한다. 응답 본문에는 refresh token을 포함하지 않는다.
프론트엔드는 기존 `responseToken`과 `accessToken`을 모두 교체하고 `/my`를
새로 로드한다. 토큰 갱신에도 최초 실행자 정보가 유지된다.

인증/역할이 없으면 401, 현재 집행부가 아니면 403이다. 존재하지 않거나
삭제된 계정, SSO 미연결 계정, 로그인 프로필이 없는 계정은 404이다.
입력 형식 오류는 기존 Zod 검증 및 공통 오류 처리를 따른다.

## 접속 기록과 배포

`auth_exchange_login_log`에 현재 실행자·최초 실행자·대상 사용자의 ID와
당시 이메일, 발급 시각을 저장한다. 기록은 인증정보 발급을 의미하며,
사용자의 이후 모든 행동을 기록하는 기능은 아니다. 토큰 원문은 넣지 않는다.
기록과 대상 refresh token 저장은 하나의 트랜잭션으로 처리한다.

배포 전에 `auth_exchange_login_log`를 생성하는 DDL을 별도로 적용해야 한다.
이번 배포의 DB 변경 범위는 이 테이블과 두 인덱스 추가뿐이다.
전체 Prisma 스키마를 `db push`로 동기화하는 방식은 사용하지 않는다.

dev·main 모두 API에서 Prisma Client를 사용하지만, 저장소의 배포 workflow에는
스키마 적용 단계가 없다. 2026-09-14 DB 도구로 조회한 dev·production 양쪽에는
`_prisma_migrations`와 새 접속 기록 테이블이 없었다. 이 조회만으로 실제 배포
이미지나 저장소 밖의 스키마 적용 절차까지 확인한 것은 아니다.

저장소의 도메인 경계 규칙에 맞춰 refresh token과 User 사이의 ORM 관계 한 쌍을
제거했지만, 실제 DB 양쪽에 있는 `auth_activated_refresh_tokens`의 사용자 외래
키는 유지한다. `userId` 컬럼과 기존 데이터도 변경하지 않는다.

## 구현 및 검증

스키마·API 규격, 검색, 로그인 교체, 화면, 회귀 테스트 순서로 구현하며
각 편집 묶음을 200줄 이내로 나눈다.

검증 대상은 검색 네 종류와 중복·삭제·미연결 처리, 집행부 인증,
토큰·쿠키 교체, 갱신 시 실행자 보존, 감사 기록 실패와 트랜잭션 롤백,
기존 로그인 프로필 선택 순서이다.
