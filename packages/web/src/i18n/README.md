# 한/영 번역 시스템 사용법

이 프로젝트는 Next.js의 `next-intl` 라이브러리를 사용하여 한국어와 영어 번역을 지원합니다.

## 📁 파일 구조

```
i18n/
├── config.ts           # 지원 언어 설정
├── locale.ts           # 사용자 로케일 관리
├── request.ts          # 번역 메시지 요청 처리
├── messages/
│   ├── ko/             # 한국어 번역 파일들
│   │   ├── common.json
│   │   ├── path.json
│   │   └── ...
│   └── en/             # 영어 번역 파일들
│       ├── common.json
│       ├── path.json
│       └── ...
└── README.md           # 이 파일
```

## 🌐 지원 언어

- **한국어 (ko)**
- **영어 (en)**

## 📝 번역 파일 관리

### 1. 기존 번역 수정하기

번역을 수정하려면 해당 언어의 JSON 파일을 편집하세요:

```json
// messages/ko/common.json
{
  "notice": "공지사항",
  "view_more": "글 더보기"
}

// messages/en/common.json
{
  "notice": "Notice",
  "view_more": "View more"
}
```

### 2. 새로운 번역 키 추가하기

새로운 번역 키를 추가할 때는 **모든 언어 파일에 동일한 키를 추가**해야 합니다:

**한국어 파일 (ko/common.json):**
```json
{
  "notice": "공지사항",
  "view_more": "글 더보기",
  "new_key": "새로운 번역"
}
```

**영어 파일 (en/common.json):**
```json
{
  "notice": "Notice",
  "view_more": "View more",
  "new_key": "New Translation"
}
```

## 🔧 컴포넌트에서 번역 사용하기

### 1. 기본 사용법

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('common'); // 네임스페이스 지정
  
  return (
    <div>
      <h1>{t('notice')}</h1>
      <button>{t('view_more')}</button>
    </div>
  );
}
```

### 2. 여러 네임스페이스 사용

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const commonT = useTranslations('common');
  const pathT = useTranslations('path');
  
  return (
    <div>
      <h1>{commonT('notice')}</h1>
      <nav>{pathT('home')}</nav>
    </div>
  );
}
```

## 📋 네임스페이스 구성

현재 프로젝트에서 사용 중인 네임스페이스:

| 네임스페이스 | 용도 |
|-------------|------|
| `common` | 공통으로 사용되는 텍스트 |
| `path` | 경로/페이지 관련 텍스트 |
| `main` | 메인 페이지 관련 텍스트 |
| `agree` | 약관/동의 관련 텍스트 |
| `division` | 분과 관련 텍스트 |

## ➕ 새로운 네임스페이스 추가하기

### 1. request.ts 수정

```typescript
// i18n/request.ts
const NAMESPACES = [
  "common", 
  "path", 
  "main", 
  "agree", 
  "division",
  "your_new_namespace" // 새로운 네임스페이스 추가
];
```

### 2. 번역 파일 생성

각 언어별로 새로운 JSON 파일을 생성하세요:

- `messages/ko/your_new_namespace.json`
- `messages/en/your_new_namespace.json`

### 3. 컴포넌트에서 사용

```tsx
const t = useTranslations('your_new_namespace');
```

## 🔄 언어 변경하기

사용자의 언어 설정을 변경하려면:

```tsx
import { setUserLocale } from '@/i18n/locale';

// 한국어로 변경
await setUserLocale('ko');

// 영어로 변경
await setUserLocale('en');
```

## 📌 주의사항

1. **키 일관성**: 모든 언어 파일에 동일한 키가 있어야 합니다.
2. **파일 이름**: 네임스페이스 파일명은 `request.ts`의 `NAMESPACES` 배열과 일치해야 합니다.
3. **JSON 형식**: 모든 번역 파일은 유효한 JSON 형식이어야 합니다.
4. **빌드 전 확인**: 번역 파일 수정 후 빌드가 정상적으로 되는지 확인하세요.

## 🛠️ 개발 시 주의사항

- 번역 키는 의미 있는 이름을 사용하세요
- 긴 텍스트는 적절한 네임스페이스로 분리하세요
- 번역이 누락된 키는 키 이름 그대로 표시됩니다 