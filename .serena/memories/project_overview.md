# SPARCS Clubs 프로젝트 개요

## 프로젝트 목적
SPARCS Clubs는 동아리 관리 시스템으로, 동아리 등록, 회원 관리, 활동 보고, 지원금 관리 등의 기능을 제공하는 웹 애플리케이션입니다.

## 기술 스택

### 모노레포 구조
- **패키지 매니저**: pnpm (v9.14.4)
- **빌드 도구**: Turbo
- **Node.js**: v22.12.0

### 백엔드 (packages/api)
- **프레임워크**: NestJS
- **데이터베이스**: MySQL (Drizzle ORM)
- **인증**: JWT, Passport
- **API 문서**: Swagger
- **테스팅**: Jest
- **로깅**: Winston
- **에러 모니터링**: Sentry

### 프론트엔드 (packages/web)
- **프레임워크**: Next.js 14.2.25
- **UI 라이브러리**: Material-UI (MUI)
- **상태 관리**: Zustand
- **데이터 페칭**: TanStack React Query
- **스타일링**: Styled Components, Emotion
- **폼 관리**: React Hook Form
- **국제화**: next-intl
- **테이블**: TanStack React Table

### 공통 패키지
- **domain**: 핵심 도메인 로직 및 엔티티
- **interface**: API 인터페이스 및 타입 정의
- **eslint-config**: 공통 ESLint 설정
- **typescript-config**: 공통 TypeScript 설정

## 주요 도메인
- **Club**: 동아리 관리
- **User**: 사용자 관리
- **Registration**: 동아리 등록 관리
- **Activity**: 활동 관리
- **Funding**: 지원금 관리
- **Notice**: 공지사항
- **Division**: 분과 관리
