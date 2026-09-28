# TU-507 enum 테이블 제거

## 변경 범위

Prisma의 enum 사전 모델 20개와 relation 13개를 제거한다. 업무 테이블의 정수 코드 컬럼, 저장된 값, 인덱스 및 업무 테이블 사이 FK는 유지한다. 요청·응답 스키마와 정수 코드의 의미도 유지한다.

동아리방 건물명은 코드에서 관리하며, 현재 동아리방 기록이 없으면 기존의 빈 문자열 응답을 유지한다. 정의되지 않은 건물 코드의 `buildingName`은 `null`이다. 2026-09-28에 stage DB를 읽기 전용으로 확인한 값은 다음과 같다.

| 코드 | 건물명 |
| --- | --- |
| 1 | 태울관(N13) |
| 2 | 학부학생회관별관(N12) |
| 3 | 학부학생회관(N11) |
| 4 | 스포츠컴플렉스(N3) |

stage DB의 enum 테이블은 Prisma의 20개와 일치했고, 참조 FK는 12개였다. Prisma에만 있는 activity feedback relation을 포함하여 환경별 FK 차이가 있으므로, [제거 SQL](TU-507-drop-enum-tables.sql)은 실제 대상 DB의 FK를 조회한다. 이름이 `_enum`으로 끝나더라도 명시한 20개에 없는 테이블은 제거하지 않는다.

## 배포

1. 대상 DB의 enum 사전 20개와 FK 정의를 백업하고, `club_building_enum` 값이 위 표와 일치하는지 확인한다. 다른 값이 있으면 코드 매핑에 반영한 후 진행한다.
2. enum 테이블을 조회하지 않는 API를 먼저 배포하고, 이전 API 인스턴스가 모두 종료되었는지 확인한다.
3. 대상 DB를 선택한 MySQL 세션에서 [제거 SQL](TU-507-drop-enum-tables.sql)을 실행한다. `ALTER`, `DROP`, `CREATE ROUTINE`, `ALTER ROUTINE`, `EXECUTE` 권한이 필요하다. SQL은 실행 중 만든 task 전용 procedure도 제거한다.
4. 남은 enum 테이블·참조 FK가 없고 동아리방 조회와 정수 코드 저장이 정상인지 확인한다.

SQL은 대상 DB 안에서 위 20개를 참조하는 FK만 제거하며 `FOREIGN_KEY_CHECKS`를 끄지 않는다. 다른 DB에서 해당 사전 테이블을 참조하면 자동으로 다른 DB를 변경하지 않고 테이블 제거 단계에서 실패한다. 테이블·FK가 없거나 중간에 멈춘 경우에도 다시 실행할 수 있다. MySQL DDL은 암묵적으로 커밋되므로 transaction rollback은 불가능하다. 이전 API로 돌아가려면 백업한 사전 테이블·데이터를 먼저 복구한다.

운영·stage DB의 SQL 실행과 배포는 이 작업에 포함하지 않는다.

## 검증

기존 `mysql2`와 Node test runner를 사용한다. 로컬 테스트 MySQL DB를 먼저 기동하고, `TEST_DATABASE_URL`이 이름에 `test`가 포함된 해당 DB를 가리키도록 설정한다. 테스트는 별도의 무작위 `clubs_tu507_test_*` DB를 만들고 종료 시 제거하며, URL의 기존 DB는 변경하지 않는다. 테스트 계정에는 임시 DB 생성·삭제 권한이 필요하다. 저장소 루트에서 기존 dotenv CLI로 `.env`의 변수 참조를 확장하여 실행한다.

```sh
pnpm --filter api exec dotenv -e ../../.env -- node --test ../../docs/tasks/TU-507-drop-enum-tables.test.mjs
```

- enum 테이블·FK가 없는 신규 환경과 반복 실행.
- 20개 사전 테이블의 FK, 같은 테이블의 복수 FK, 여러 테이블의 FK 및 특수문자 FK 이름 제거.
- 업무 데이터·코드 컬럼·인덱스와 목록 밖 테이블·FK 보존.
- 사전 행 없이 새 코드 저장 허용 및 업무 FK의 잘못된 값 거부 유지.
- 실행 후 임시 procedure 제거.
