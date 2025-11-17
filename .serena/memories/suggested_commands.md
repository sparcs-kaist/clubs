# SPARCS Clubs 개발 명령어

## 프로젝트 설정
```bash
# 의존성 설치
pnpm i

# 환경변수 설정 (.env.example을 .env로 복사)
cp .env.example .env

# 로컬 DB 설정 및 스키마 동기화
pnpm generate
```

## 개발 실행
```bash
# 전체 개발 모드 실행 (watch 모드)
pnpm dev

# 목업 모드로 개발 실행
pnpm dev-mock

# 데몬 없이 개발 모드 실행
pnpm dev-no-d

# Storybook 실행
pnpm storybook
```

## 빌드 및 배포
```bash
# 전체 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

## 데이터베이스 관리
```bash
# DB 컨테이너 실행
pnpm db-up

# DB 컨테이너 종료
pnpm db-down

# DB 스키마 생성/업데이트
pnpm db-generate
```

## 코드 품질
```bash
# 린팅
pnpm lint

# 테스트 실행
pnpm test

# API 단위 테스트
pnpm --filter=api test:unit

# API E2E 테스트
pnpm --filter=api test:e2e

# 테스트 커버리지
pnpm --filter=api test:cov
```

## 패키지별 명령어
```bash
# 특정 패키지에서 명령어 실행
pnpm --filter=api [command]
pnpm --filter=web [command]
pnpm --filter=domain [command]
pnpm --filter=interface [command]
```

## 유틸리티 명령어 (macOS)
```bash
# 파일 검색
find . -name "*.ts" -type f

# 텍스트 검색
grep -r "pattern" packages/

# 디렉토리 구조 확인
tree packages/

# 프로세스 확인
ps aux | grep node

# 포트 사용 확인
lsof -i :3000
```
