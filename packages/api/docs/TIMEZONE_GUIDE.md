# DB 시간 처리 가이드라인

이 문서는 프로젝트에서 데이터베이스의 시간(datetime) 필드를 처리하는 방법에 대한 가이드라인입니다.

## 개요

- **DB 저장**: KST (Asia/Seoul, UTC+9) 기준으로 저장
- **DB 스키마**: `datetime` 타입 사용 (시간 정보 포함)
- **애플리케이션 내부**: UTC로 해석된 Date 객체 사용
- **API 응답**: KST 기준 ISO 문자열 (`+09:00` 포함)로 변환

## 핵심 원칙

1. **DB 스키마는 `datetime` 사용**: `date` 타입 대신 `datetime` 타입을 사용하여 시간 정보를 포함합니다.
2. **Repository 레벨에서 변환**: Drizzle 쿼리 결과는 Repository에서 자동으로 변환합니다.
3. **내부 로직은 Date 객체 사용**: Repository와 Service 내부 로직에서는 항상 Date 객체를 사용합니다.
4. **API 응답만 ISO KST 문자열**: **클라이언트로 전송할 때만** KST 기준 ISO 문자열로 변환합니다.

### ⚠️ 중요: ISO 변환 사용 시점

- ❌ **Repository에서 ISO 변환 금지**: Repository는 항상 Date 객체를 반환해야 합니다.
- ❌ **Service 내부 로직에서 ISO 변환 금지**: 내부 로직에서는 Date 객체를 그대로 사용합니다.
- ✅ **Service API 응답에서만 ISO 변환**: API 응답을 만들 때만 `convertDateFieldsToISO` (권장), `formatInTimeZone`, 또는 `makeObjectPropsFromDBTimezoneAsISO`를 사용합니다.

## DB 스키마 정의

### ✅ 올바른 방법

```typescript
// packages/api/src/drizzle/schema/example.schema.ts
import { datetime } from "drizzle-orm/mysql-core";

export const ExampleTable = mysqlTable("example_table", {
  id: int("id").primaryKey().autoincrement(),
  startTerm: datetime("start_term"), // ✅ datetime 사용
  endTerm: datetime("end_term"),     // ✅ datetime 사용
});
```

### ❌ 잘못된 방법

```typescript
import { date } from "drizzle-orm/mysql-core";

export const ExampleTable = mysqlTable("example_table", {
  startTerm: date("start_term"), // ❌ date 타입은 시간 정보가 없음
  endTerm: date("end_term"),     // ❌ 시간대 변환 시 문제 발생
});
```

## Repository 레벨 처리

### Drizzle 쿼리 결과 변환

Drizzle ORM은 DB의 `datetime` 값을 UTC로 해석한 Date 객체로 반환합니다. 하지만 실제로는 KST 기준이므로 변환이 필요합니다.

#### 단일 쿼리 결과

```typescript
// packages/api/src/feature/example/repository/example.repository.ts
import { makeObjectPropsFromDBTimezone } from "@sparcs-clubs/api/common/util/util";

async getExample(id: number) {
  const result = await this.db
    .select()
    .from(ExampleTable)
    .where(eq(ExampleTable.id, id))
    .execute()
    .then(takeOnlyOne);
  
  // ✅ 자동으로 타임존 변환
  return makeObjectPropsFromDBTimezone(result);
}
```

#### 배열 쿼리 결과

```typescript
async getExamples() {
  const results = await this.db
    .select()
    .from(ExampleTable)
    .where(isNull(ExampleTable.deletedAt))
    .execute();
  
  // ✅ 배열도 자동으로 처리
  return makeObjectPropsFromDBTimezone(results);
}
```

### BaseRepository 사용 시

`BaseRepository`를 상속받은 경우, `dbToModel` 메서드에서 자동으로 변환됩니다.

```typescript
// packages/api/src/feature/example/repository/example.repository.ts
@Injectable()
export class ExampleRepository extends BaseSingleTableRepository<...> {
  // dbToModel이 자동으로 makeObjectPropsFromDBTimezone을 호출
  // 추가 작업 불필요
}
```

### ⚠️ 중요: ISO 변환은 API 응답에만 사용

**핵심 원칙**: `makeObjectPropsFromDBTimezoneAsISO`는 **API 응답으로 클라이언트에 보낼 때만** 사용합니다. 내부 로직에서는 항상 Date 객체를 사용합니다.

- ✅ **Repository**: 항상 `makeObjectPropsFromDBTimezone` 사용 (Date 객체 반환)
- ✅ **Service 내부 로직**: Date 객체 그대로 사용
- ✅ **Service API 응답**: `formatInTimeZone` 또는 `makeObjectPropsFromDBTimezoneAsISO` 사용 (ISO 문자열 반환)

## Service 레벨 처리

### 내부 로직 (Date 객체 사용)

Repository에서 변환된 Date 객체를 받아서 내부 로직에서 사용합니다.

```typescript
// packages/api/src/feature/example/service/example.service.ts
async getExamples() {
  // Repository에서 변환된 Date 객체 반환
  const examples = await this.exampleRepository.find({});
  
  // ✅ Date 객체를 그대로 사용 (내부 로직)
  const activeExamples = examples.filter(
    e => e.startTerm <= now && now <= e.endTerm
  );
  
  return { examples: activeExamples };
}
```

### API 응답 (ISO 문자열 변환)

**API 응답으로 클라이언트에 보낼 때만** ISO KST 문자열로 변환합니다.

#### ✅ 권장 방법: `convertDateFieldsToISO` 사용

`convertDateFieldsToISO` 함수를 사용하면 Date 필드를 자동으로 변환할 수 있습니다.

```typescript
// packages/api/src/feature/example/service/example.service.ts
import { convertDateFieldsToISO } from "@sparcs-clubs/api/common/util/util";

async getPublicExamples() {
  // Repository에서 Date 객체 반환
  const examples = await this.exampleRepository.find({});
  
  // ✅ API 응답용: Date 필드를 자동으로 ISO KST 문자열로 변환
  return {
    examples: convertDateFieldsToISO(examples),
  };
}
```

`convertDateFieldsToISO`는 다음 Date 필드를 자동으로 변환합니다:
- `startTerm`, `endTerm`
- `createdAt`, `updatedAt`, `editedAt`, `commentedAt`
- `professorApprovedAt`, `expenditureDate`

중첩 객체와 배열도 자동으로 처리됩니다:

```typescript
async getPublicExample(id: number) {
  const example = await this.exampleRepository.find({ id });
  
  // ✅ 중첩 객체(durations, comments 등)도 자동 변환
  return convertDateFieldsToISO({
    ...example,
    durations: example.durations,
    comments: example.comments.map(c => ({
      content: c.content,
      createdAt: c.createdAt,
    })),
  });
}
```

#### 대안: `formatInTimeZone` 직접 사용

필요한 경우 `formatInTimeZone`을 직접 사용할 수도 있습니다:

```typescript
// packages/api/src/feature/example/service/example.service.ts
import { formatInTimeZone } from "date-fns-tz";
import { DB_TIMEZONE } from "@sparcs-clubs/api/common/util/decorators/time-decorator";

async getPublicExamples() {
  const examples = await this.exampleRepository.find({});
  
  // ✅ API 응답용: ISO KST 문자열로 변환
  return {
    examples: examples.map(example => ({
      ...example,
      startTerm: formatInTimeZone(
        example.startTerm,
        DB_TIMEZONE,
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      ) as unknown as Date,
      endTerm: formatInTimeZone(
        example.endTerm,
        DB_TIMEZONE,
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      ) as unknown as Date,
    })),
  };
}
```

#### 대안: `makeObjectPropsFromDBTimezoneAsISO` 사용

모든 Date 필드를 자동으로 변환하려면 `makeObjectPropsFromDBTimezoneAsISO`를 사용할 수도 있습니다:

```typescript
import { makeObjectPropsFromDBTimezoneAsISO } from "@sparcs-clubs/api/common/util/util";

async getPublicExamples() {
  const examples = await this.exampleRepository.find({});
  
  // ✅ API 응답용: 모든 Date 필드를 ISO KST 문자열로 변환
  return {
    examples: makeObjectPropsFromDBTimezoneAsISO(examples),
  };
}
```

## 날짜 비교 로직

### ✅ 올바른 방법

```typescript
// DB에서 가져온 Date 객체를 직접 비교
const now = new Date();
const isActive = deadline.startTerm <= now && now <= deadline.endTerm;

// 날짜만 비교하는 경우
const isSameDay = 
  deadline.startTerm.toDateString() === now.toDateString();
```

### ❌ 잘못된 방법

```typescript
// ❌ addDays 같은 변환 로직 사용 금지
const isActive = now < addDays(deadline.endTerm, 1);

// ❌ 수동 타임존 변환 금지
const kstDate = toZonedTime(dbDate, "Asia/Seoul");
```

## 새로운 날짜 생성

### DB에 저장할 날짜

```typescript
// packages/api/src/feature/example/service/example.service.ts
import { getKSTDate, makeObjectPropsToDBTimezone } from "@sparcs-clubs/api/common/util/util";

async createExample(data: CreateExampleDto) {
  const now = getKSTDate(); // 현재 시간을 KST로 가져오기
  
  // 또는 특정 날짜를 KST로 변환
  const startTerm = makeObjectPropsToDBTimezone({ 
    startTerm: data.startTerm 
  }).startTerm;
  
  await this.exampleRepository.create({
    startTerm,
    endTerm: data.endTerm,
  });
}
```

### 종료일을 하루 끝으로 설정

```typescript
// packages/web/src/utils/Date/getKSTDate.ts의 getLocalDateLastTime 사용
import { getLocalDateLastTime } from "@sparcs-clubs/web/utils/Date/getKSTDate";

const endTerm = getLocalDateLastTime(selectedDate); // 23:59:59로 설정
```

## API 응답 형식

### KST 기준 ISO 문자열

API 응답에서 날짜는 다음과 같은 형식으로 반환됩니다:

```json
{
  "startTerm": "2026-01-26T00:00:00.000+09:00",
  "endTerm": "2026-02-01T23:59:59.000+09:00"
}
```

### 프론트엔드 처리

프론트엔드의 `parseKST` 함수가 자동으로 `+09:00` 형식의 문자열을 Date 객체로 변환합니다.

```typescript
// packages/web/src/lib/axios.ts의 parseKST 함수가 자동 처리
// 추가 작업 불필요
```

## 유틸리티 함수 요약

### `makeObjectPropsFromDBTimezone`

- **용도**: DB에서 가져온 Date 객체를 UTC로 변환 (내부 로직용)
- **입력**: 단일 객체 또는 배열
- **출력**: Date 객체 (UTC 기준)

```typescript
const result = makeObjectPropsFromDBTimezone(dbResult);
const results = makeObjectPropsFromDBTimezone(dbResults);
```

### `convertDateFieldsToISO` ⭐ 권장

- **용도**: 객체의 Date 필드들을 KST 기준 ISO 문자열로 변환 (API 응답용)
- **사용 시점**: **API 응답으로 클라이언트에 보낼 때만** 사용
- **입력**: 단일 객체 또는 배열
- **출력**: ISO 문자열 (`+09:00` 포함)
- **자동 변환 필드**: `startTerm`, `endTerm`, `createdAt`, `updatedAt`, `editedAt`, `commentedAt`, `professorApprovedAt`, `expenditureDate`
- **특징**: 중첩 객체와 배열도 자동으로 처리

```typescript
// ✅ Service 레이어에서 API 응답 생성 시
const results = await this.repository.find({});
return { data: convertDateFieldsToISO(results) };

// ✅ 중첩 객체도 자동 처리
return convertDateFieldsToISO({
  id: 1,
  startTerm: new Date(),
  durations: [
    { startTerm: new Date(), endTerm: new Date() }
  ],
  comments: [
    { content: "test", createdAt: new Date() }
  ]
});

// ❌ Repository에서 사용 금지
async getExamples() {
  return convertDateFieldsToISO(results); // ❌
}
```

### `makeObjectPropsFromDBTimezoneAsISO`

- **용도**: DB에서 가져온 Date 객체를 KST 기준 ISO 문자열로 변환 (모든 Date 필드)
- **사용 시점**: **API 응답으로 클라이언트에 보낼 때만** 사용
- **입력**: 단일 객체 또는 배열
- **출력**: ISO 문자열 (`+09:00` 포함)
- **특징**: 모든 Date 필드를 자동으로 변환 (특정 필드만 선택 불가)

```typescript
// ✅ Service 레이어에서 API 응답 생성 시
const results = await this.repository.find({});
return { data: makeObjectPropsFromDBTimezoneAsISO(results) };

// ❌ Repository에서 사용 금지
async getExamples() {
  return makeObjectPropsFromDBTimezoneAsISO(results); // ❌
}
```

### `makeObjectPropsToDBTimezone`

- **용도**: 애플리케이션의 Date 객체를 DB에 저장하기 전 KST로 변환
- **입력**: 단일 객체 또는 배열
- **출력**: Date 객체 (KST 기준)

```typescript
const dbData = makeObjectPropsToDBTimezone(applicationData);
```

### `getKSTDate`

- **용도**: 현재 시간을 KST 기준으로 가져오기
- **출력**: Date 객체 (KST 기준)

```typescript
const now = getKSTDate();
```

## 체크리스트

새로운 시간 관련 기능을 추가할 때 확인할 사항:

- [ ] DB 스키마에 `datetime` 타입 사용
- [ ] Repository에서 `makeObjectPropsFromDBTimezone` 사용 (Date 객체 반환)
- [ ] Service 내부 로직에서는 Date 객체 그대로 사용
- [ ] **API 응답에서만** `convertDateFieldsToISO` (권장) 또는 `formatInTimeZone` 또는 `makeObjectPropsFromDBTimezoneAsISO` 사용
- [ ] Repository에서 ISO 변환하지 않음 (항상 Date 객체 반환)
- [ ] 날짜 비교 시 `addDays` 같은 변환 로직 사용하지 않음
- [ ] DB에 저장할 날짜는 `makeObjectPropsToDBTimezone`으로 변환
- [ ] 종료일을 하루 끝으로 설정할 때 `getLocalDateLastTime` 사용

## 예제: 지원금 기간 관리

### Repository (Date 객체 반환)

```typescript
// packages/api/src/feature/semester/repository/funding.sql.repository.ts
async getFundingDeadlines(semesterId: number) {
  const fundingDeadlines = await this.db
    .select()
    .from(FundingDeadlineD)
    .where(and(
      eq(FundingDeadlineD.semesterId, semesterId),
      isNull(FundingDeadlineD.deletedAt),
    ))
    .execute();
  
  // ✅ Date 객체로 변환 (내부 로직용)
  return makeObjectPropsFromDBTimezone(fundingDeadlines);
}
```

### Service (API 응답에서만 ISO 변환)

```typescript
// packages/api/src/feature/semester/service/funding-deadline.service.ts
import { convertDateFieldsToISO } from "@sparcs-clubs/api/common/util/util";

async getFundingDeadlines() {
  // Repository에서 Date 객체 반환
  const fundingDeadlines = await this.fundingDeadlineSqlRepository
    .getFundingDeadlines(semesterId);
  
  // ✅ API 응답용: Date 필드를 자동으로 ISO KST 문자열로 변환
  return convertDateFieldsToISO(
    fundingDeadlines.map(deadline => ({
      id: deadline.id,
      startTerm: deadline.startTerm,
      endTerm: deadline.endTerm,
      deadlineEnum: deadline.deadlineEnum,
      semesterId: deadline.semesterId,
      activityDId: deadline.activityDId,
    })),
  );
}
```

### ❌ 잘못된 예제

```typescript
// ❌ Repository에서 ISO 변환 (금지!)
async getFundingDeadlines(semesterId: number) {
  const results = await this.db.select()...execute();
  return makeObjectPropsFromDBTimezoneAsISO(results); // ❌
}

// ❌ Service 내부 로직에서 ISO 변환 (금지!)
async checkDeadline(deadlineId: number) {
  const deadline = await this.repository.getDeadline(deadlineId);
  const isoString = formatInTimeZone(...); // ❌ 내부 로직에서는 불필요
  // Date 객체를 그대로 사용해야 함
}
```

## 주의사항

1. **ISO 변환은 API 응답에만**: `convertDateFieldsToISO`, `makeObjectPropsFromDBTimezoneAsISO`, `formatInTimeZone`은 **API 응답으로 클라이언트에 보낼 때만** 사용합니다. Repository나 Service 내부 로직에서는 사용하지 않습니다.

2. **Repository는 항상 Date 객체 반환**: Repository는 `makeObjectPropsFromDBTimezone`만 사용하여 Date 객체를 반환합니다.

3. **절대 수동 타임존 변환 금지**: `toZonedTime`, `fromZonedTime`을 직접 사용하지 말고 유틸리티 함수를 사용하세요.

4. **`addDays` 사용 금지**: 날짜 비교 시 `addDays`를 사용하여 하루를 더하는 로직을 사용하지 마세요. DB에 이미 정확한 시간이 저장되어 있습니다.

5. **일관성 유지**: 모든 시간 관련 로직은 이 가이드라인을 따르세요. 예외적인 경우는 팀과 논의 후 결정하세요.

6. **테스트**: 시간 관련 로직은 다양한 시간대에서 테스트하세요.

## 참고

- `packages/api/src/common/util/util.ts`: 핵심 유틸리티 함수
- `packages/api/src/common/base/base.repository.ts`: BaseRepository의 변환 로직
- `packages/web/src/lib/axios.ts`: 프론트엔드의 `parseKST` 함수
