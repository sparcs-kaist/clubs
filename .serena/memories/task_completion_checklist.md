# 작업 완료 시 체크리스트

## 코드 작성 후 필수 단계

### 1. 코드 품질 검사
```bash
# 린팅 검사
pnpm lint

# 타입 검사 (각 패키지별)
pnpm --filter=api build
pnpm --filter=web build
pnpm --filter=domain build
pnpm --filter=interface build
```

### 2. 테스트 실행
```bash
# API 테스트
pnpm --filter=api test:unit
pnpm --filter=api test:e2e

# 전체 테스트
pnpm test
```

### 3. 빌드 검증
```bash
# 전체 빌드
pnpm build

# 개발 서버 실행 확인
pnpm dev
```

### 4. 데이터베이스 관련 작업 시
```bash
# 스키마 변경 시 마이그레이션
pnpm db-generate

# DB 연결 확인
pnpm db-up
```

### 5. 커밋 전 체크리스트
- [ ] ESLint 오류 없음
- [ ] TypeScript 컴파일 오류 없음
- [ ] 테스트 통과
- [ ] 빌드 성공
- [ ] 코드 리뷰 완료
- [ ] 관련 문서 업데이트

### 6. 커밋 메시지 규칙
```
type(scope): description

# 예시
feat(club): add club member management API
fix(web): resolve club card rendering issue
docs(readme): update installation guide
```

### 7. 브랜치 전략
- **main**: 프로덕션 브랜치
- **develop**: 개발 브랜치
- **feature/**: 기능 개발 브랜치
- **hotfix/**: 긴급 수정 브랜치

### 8. 배포 전 최종 검증
```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 실행 테스트
pnpm start

# E2E 테스트
pnpm --filter=api test:e2e
```
