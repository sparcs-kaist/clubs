# 웹 줄바꿈 검사

일반 텍스트는 `body`의 `white-space: pre-line`을 상속해 입력한 줄바꿈을 표시합니다.
들여쓰기까지 보존하는 본문에는 `pre-wrap`을, 공백 없이 긴 문자열도 감싸야 하면 `overflow-wrap: anywhere`를 사용합니다.

`pnpm web-newlines:check`는 pre-push에서 실행됩니다. 현재 커밋을 `origin/dev`와 비교해
기본 설정이 유지되는지, CSS·styled-components·JSX 스타일에 줄바꿈을 접는 선언이 추가됐는지 검사합니다.
한 줄 표시가 필요한 제목이나 셀은 선언 바로 윗줄에 이유를 기록하세요.

```css
/* web-newline: single-line -- 고정 높이 목록의 제목은 한 줄로 표시합니다. */
white-space: nowrap;
```

스타일 검사는 자유 입력이 API나 표시 전 변환에서 개행을 유지하는지까지 확인하지 않습니다.
