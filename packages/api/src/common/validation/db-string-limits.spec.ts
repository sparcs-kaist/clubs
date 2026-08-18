import { zDbText } from "@clubs/domain/common/string";

import { zMinorExpense } from "@clubs/interface/api/funding/type/funding.type";
import {
  zClubNameEn,
  zClubNameKr,
  zFileName,
} from "@clubs/interface/common/commonString";

describe("DB string limits", () => {
  it("accepts the funding explanation that caused TU-467", () => {
    const explanation = `수련회 주최측인 (사)한국기독학생회 대전지방회에서 발급한 최찬영 외 18인에 대한 총 19인의 참가확인서 및 사진. 학부생 중 참여인원은 주하진, 최찬영, 송애린, 윤성민, 윤영찬, 장여준, 이명제, 민시호, 김성진, 김재용, 강민준, 유한결, 한태주, 남서빈, 이승윤, 박지성 총 16명이며, 학사 2인 및 타 캠퍼스 인원 1인 참석으로 총 인원 19인 등록.

(수정) 외부 행사임을 증명하기 위해 카이스트 참가자 외 다른 캠퍼스 및 외부 참가자와 같이 찍은 단체사진, 조모임 사진, 현장 사진 및 명찰 사진 첨부.`;

    expect(zMinorExpense.shape.explanation.safeParse(explanation).success).toBe(
      true,
    );
  });

  it("enforces both the logical and physical MySQL TEXT limits", () => {
    expect(zDbText.safeParse("a".repeat(60_000)).success).toBe(true);
    expect(zDbText.safeParse("a".repeat(60_001)).success).toBe(false);
    expect(zDbText.safeParse("한".repeat(21_845)).success).toBe(true);
    expect(zDbText.safeParse("한".repeat(21_846)).success).toBe(false);
  });

  it.each([
    [zClubNameKr, 30],
    [zClubNameEn, 100],
    [zFileName, 255],
  ])("matches VARCHAR limits", (schema, maxLength) => {
    expect(schema.safeParse("a".repeat(maxLength)).success).toBe(true);
    expect(schema.safeParse("a".repeat(maxLength + 1)).success).toBe(false);
  });
});
