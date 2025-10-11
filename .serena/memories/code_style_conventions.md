# 코드 스타일 및 컨벤션

## 일반 규칙
- **언어**: TypeScript 사용
- **패키지 매니저**: pnpm
- **모노레포**: Turbo 기반 워크스페이스
- **린팅**: ESLint + Prettier
- **커밋**: Conventional Commits (Husky + lint-staged)

## 네이밍 컨벤션
### 파일 및 디렉토리
- **컴포넌트**: PascalCase (e.g., ClubCard.tsx)
- **서비스/훅**: camelCase (e.g., useGetClubsList.ts)
- **타입/인터페이스**: PascalCase (e.g., IClub, ClubType)
- **상수**: UPPER_SNAKE_CASE
- **디렉토리**: kebab-case (e.g., manage-club)

### 코드 내 네이밍
- **변수/함수**: camelCase
- **클래스**: PascalCase
- **인터페이스**: I 접두사 (e.g., IClub)
- **타입**: T 접두사 또는 Type 접미사
- **Zod 스키마**: z 접두사 (e.g., zClub)

## 아키텍처 패턴
### 백엔드 (NestJS)
- **레이어드 아키텍처**: Controller → Service → Repository
- **모듈 구조**: 기능별 모듈 분리
- **DTO**: Zod 스키마 기반 검증
- **예외 처리**: NestJS Exception Filters

### 프론트엔드 (Next.js)
- **컴포넌트 구조**: Atomic Design 패턴
  - frames/: 페이지 레벨 컴포넌트
  - components/: 재사용 컴포넌트
  - _atomic/: 원자적 컴포넌트
- **상태 관리**: Zustand (전역) + React Hook Form (폼)
- **데이터 페칭**: TanStack React Query

## 타입 정의
### Zod 스키마 활용
```typescript
// 도메인 객체 정의
export const zClub = z.object({
  id: zId,
  nameKr: z.string().max(255).min(1),
  nameEn: z.string().max(255).min(1),
  description: z.string(),
  foundingYear: z.coerce.number(),
});

export type IClub = z.infer<typeof zClub>;
```

### API 인터페이스
- **요청/응답**: interface 패키지에서 중앙 관리
- **OpenAPI**: Zod 스키마에서 자동 생성

## 디렉토리 구조 패턴
```
packages/
├── api/src/feature/[domain]/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── model/
│   └── dto/
├── web/src/features/[domain]/
│   ├── frames/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── types/
├── domain/src/[domain]/
└── interface/src/api/[domain]/
```

## 테스트 규칙
- **단위 테스트**: Jest
- **E2E 테스트**: Jest + Supertest
- **테스트 파일**: *.spec.ts, *.test.ts
- **커버리지**: 최소 80% 목표
