# 프로젝트 규칙

## 프로젝트 코드 구조

본 프로젝트는 모노레포 구조로 관리되며, 주요 패키지(디렉토리)는 `packages/` 내에 위치합니다.

| 패키지 | 역할 |
| --- | --- |
| `packages/api` | 백엔드 API 서버 관련 코드 (NestJS) |
| `packages/web` | 프론트엔드 웹 애플리케이션 관련 코드 |
| `packages/domain` | 프로젝트의 핵심 도메인 로직 및 엔티티 정의 |
| `packages/interface` | API 요청/응답, DTO 등 인터페이스 정의 |
| `packages/eslint-config` | ESLint 설정 공유 |
| `packages/typescript-config` | TypeScript 설정 공유 |

## 레퍼런스 제안 규칙

- 레퍼런스가 필요한 답변 생성 시에 반드시 레퍼런스 링크를 기록합니다. 링크에 할루시네이션이 없도록 반드시 체크한 뒤 답변합니다.
- 커뮤니티의 의견보다는 공식 가이드의 레퍼런스를 우선시합니다.

## 작업 모드 규칙

- 별도 요청이 없다면, 바로 구현을 시작하지 않습니다. 다음과 같은 스텝을 따릅니다:
  1. 먼저 아키텍처나 인터페이스를 제안합니다. 가능한 경우 mermaid 다이어그램을 그려 제안합니다.
  2. 프로그래머로부터 아키텍처나 인터페이스 리뷰가 끝났다면, 실제 구현할 스텝을 제안합니다. 각 스텝은 최대 200줄이 넘지 않는 한도 안에서 제안합니다.
  3. 제안을 주고 받으며 구현을 완성합니다.

## Task 진행 프로세스

개발자가 task를 시작하려고 한다면, 다음 과정을 따릅니다:

1. **정보 검토**: Task를 수행하기 위한 정보들이 충분한지 검토합니다. (기획 문서, 에러 스택 트레이스 등)
   - TU 번호가 아직 없는 신규 task라면, 먼저 Notion Task DB에 task 문서를 작성하여 TU 번호를 발급받고, 발급된 TU 번호를 기준으로 branch/worktree를 생성합니다.
2. **Task 리뷰**: Task를 검토합니다. 엣지케이스에 대해 어떻게 핸들링하면 좋을지, 일반적인 동작이 아닌 경우 다른 옵션을 제시합니다.
3. **기획 확정**: 의견을 충분히 교환하여 프로그래머가 요청하면, 기획을 다시 한 번 정리해서 알려줍니다.
4. **구현**:
   - Database의 schema를 정의합니다.
   - Resource에 들어갈 API spec을 정의합니다.
   - 확정된 API spec을 markdown 형식으로 정의하여 출력합니다.
   - Behavior에 들어갈 business logic을 정의합니다.
   - 동작성을 확인하기 위한 test를 정의합니다.

## PR 작성 규칙

Codex가 PR을 생성할 때는 PR description에 `## Patch Note` 섹션과 아래 machine-readable block을 반드시 포함합니다.

```md
<!-- clubs:patch-note:start -->
category: feature | fix | design | docs | internal | none
text: 사용자에게 보여도 자연스러운 한국어 패치노트 문장
<!-- clubs:patch-note:end -->
```

릴리즈용 `dev -> main` PR 제목은 `[PATCH] Release: from X.Y.Z`, `[MINOR] Release: from X.Y.Z`, `[MAJOR] Release: from X.Y.Z` 중 하나로 시작해야 합니다. 기본값은 `[PATCH]`입니다. 패치노트 생성 workflow가 완료되면 PR 제목은 `[TYPE] Release: X.Y.Z` 형식으로 갱신됩니다.

- 사용자에게 보일 기능 추가는 `category: feature`를 사용합니다.
- 사용자에게 보일 버그 수정은 `category: fix`를 사용합니다.
- UI, 문구, 디자인 변경은 `category: design`을 사용합니다.
- 문서 변경은 `category: docs`를 사용합니다.
- 내부 리팩터링, 테스트, CI 등 사용자에게 직접 보이지 않는 변경은 `category: internal` 또는 `category: none`을 사용합니다.
- `text`에는 구현 세부사항, 파일명, 함수명보다 사용자 관점의 변경사항을 씁니다.
- 여러 항목이 필요하면 `text:` 아래에 bullet을 여러 개 작성합니다.
- 릴리즈 패치노트 자동 생성기는 이 block만 신뢰하며, `internal`과 `none`은 앱 패치노트에서 제외합니다.

예시:

```md
<!-- clubs:patch-note:start -->
category: fix
text: 활동보고서 상세 화면에서 반려 사유가 보이지 않던 문제를 수정했습니다.
<!-- clubs:patch-note:end -->
```

## Feature: Activity Report

- 관련 경로: `packages/web/**/activity-report/**`, `packages/api/**/activity/**`
- 주요 목적: 사용자 활동을 집계하여 보고서 형태로 제공
- 주요 컴포넌트/모듈: `ActivityService`, `ReportGenerator`, `ActivityLogStorage`
- 주요 기능: 활동 데이터 수집, 보고서 생성, 보고서 필터링, 보고서 다운로드
