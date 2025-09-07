import { registry } from "@clubs/interface/open-api";

export * from "./endpoint/apiClb001";
export { default as apiClb001 } from "./endpoint/apiClb001";
export * from "./endpoint/apiClb002";
export { default as apiClb002 } from "./endpoint/apiClb002";
export * from "./endpoint/apiClb003";
export { default as apiClb003 } from "./endpoint/apiClb003";
export * from "./endpoint/apiClb004";
export { default as apiClb004 } from "./endpoint/apiClb004";
export * from "./endpoint/apiClb005";
export { default as apiClb005 } from "./endpoint/apiClb005";
export * from "./endpoint/apiClb006";
export { default as apiClb006 } from "./endpoint/apiClb006";
export * from "./endpoint/apiClb007";
export { default as apiClb007 } from "./endpoint/apiClb007";
export * from "./endpoint/apiClb008";
export { default as apiClb008 } from "./endpoint/apiClb008";
export * from "./endpoint/apiClb009";
export { default as apiClb009 } from "./endpoint/apiClb009";
export * from "./endpoint/apiClb010";
export { default as apiClb010 } from "./endpoint/apiClb010";
export * from "./endpoint/apiClb011";
export { default as apiClb011 } from "./endpoint/apiClb011";
export * from "./endpoint/apiClb012";
export { default as apiClb012 } from "./endpoint/apiClb012";
export * from "./endpoint/apiClb013";
export { default as apiClb013 } from "./endpoint/apiClb013";
export * from "./endpoint/apiClb014";
export { default as apiClb014 } from "./endpoint/apiClb014";
export * from "./endpoint/apiClb015";
export { default as apiClb015 } from "./endpoint/apiClb015";
export * from "./endpoint/apiClb016";
export { default as apiClb016 } from "./endpoint/apiClb016";

registry.registerPath({
  tags: ["club"],
  method: "head",
  path: "/#/Club",
  summary: "CLB-???: 동아리(Club)에 관한 도메인 설명",
  description: `# 동아리(Club) 도메인

동아리 관련 기능들을 제공하는 API 집합입니다.

## 주요 기능

### 1. 동아리 정보 조회
- **CLB-001**: 전체 동아리 목록 조회 (분과별 그룹화)
- **CLB-002**: 동아리 상세 정보 조회
- **CLB-003**: 내가 활동했던 동아리 목록 조회 (학생용)
- **CLB-016**: 지도교수가 지도했던 동아리 목록 조회 (교수용)

### 2. 동아리 기본 정보 관리
- **CLB-004**: 동아리 기본 정보 조회 (설명, 동아리방 비밀번호)
- **CLB-005**: 동아리 기본 정보 수정

### 3. 동아리 대표자 및 대의원 관리
- **CLB-006**: 동아리 대표자 및 대의원 정보 조회
- **CLB-007**: 동아리 대표자 및 대의원 변경
- **CLB-008**: 대표자/대의원 변경 후보 목록 조회
- **CLB-015**: 내가 대표자/대의원으로 있는 동아리 정보 조회

### 4. 동아리 대표자 변경 신청 관리
- **CLB-011**: 동아리 대표자 변경 신청 조회
- **CLB-012**: 동아리 대표자 변경 신청 취소
- **CLB-013**: 나에게 신청한 대표자 변경 조회 (마이페이지)
- **CLB-014**: 대표자 변경 신청 승인/거절

### 5. 동아리 회원 관리
- **CLB-009**: 동아리가 활동한 학기 목록 조회
- **CLB-010**: 특정 학기 동아리 회원 정보 조회

## 권한 체계

- **공개 API**: CLB-001, CLB-002 (누구나 조회 가능)
- **학생 API**: CLB-003, CLB-013, CLB-014, CLB-015 (로그인한 학생)
- **동아리 대표자/대의원**: CLB-004~012 (해당 동아리 권한 필요)
- **지도교수**: CLB-016 (지도교수 권한 필요)

## 도메인 객체

- **Club**: 동아리 기본 정보 (이름, 설명, 설립년도 등)
- **ClubDelegate**: 동아리 대표자/대의원 정보
- **ClubDelegateChangeRequest**: 대표자 변경 신청
- **ClubMember**: 동아리 회원 정보
- **ClubSemester**: 학기별 동아리 정보
- **Division**: 동아리 분과 정보
  `,
  responses: {},
});
