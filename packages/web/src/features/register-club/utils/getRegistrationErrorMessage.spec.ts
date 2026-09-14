import { AxiosError, AxiosHeaders } from "axios";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RegistrationErrorCode } from "@clubs/interface/api/registration/type/registration-error";

import { getRegistrationErrorMessage } from "./getRegistrationErrorMessage.ts";

const requestError = (data: unknown, status = 400) => {
  const error = new AxiosError("Request failed");
  error.response = {
    data,
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

describe("registration error guidance", () => {
  it("maps each registration error code to distinct actionable Korean guidance", () => {
    const results = Object.values(RegistrationErrorCode).map(code =>
      getRegistrationErrorMessage(
        requestError({ message: { code, message: "internal detail" } }),
      ),
    );
    assert.equal(
      new Set(results).size,
      Object.values(RegistrationErrorCode).length,
    );
    results.forEach(message => {
      assert.match(message, /[가-힣]/);
      assert.doesNotMatch(
        message,
        /internal detail|처리 결과를 확인하지 못했습니다/,
      );
    });
    assert.match(
      getRegistrationErrorMessage(
        requestError({
          message: { code: RegistrationErrorCode.AlreadyClubDelegate },
        }),
      ),
      /대표자·대의원/,
    );
    assert.match(
      getRegistrationErrorMessage(
        requestError({
          message: { code: RegistrationErrorCode.ClubAlreadyApplied },
        }),
      ),
      /이 동아리의 이번 학기/,
    );
    assert.match(
      getRegistrationErrorMessage(
        requestError({
          message: { code: RegistrationErrorCode.StudentAlreadyApplied },
        }),
      ),
      /이번 학기에 제출한/,
    );
  });

  it("names invalid input fields without displaying raw server data", () => {
    const error = requestError({
      message: [
        { path: ["professor", "email"], message: "invalid private value" },
        { path: ["professor", "name"] },
        { path: ["phoneNumber"] },
      ],
    });
    assert.equal(
      getRegistrationErrorMessage(error),
      "다음 항목의 입력값을 확인해주세요: 지도교수 정보, 대표자 전화번호.",
    );
    assert.match(
      getRegistrationErrorMessage(requestError({ message: [{ path: [] }] })),
      /신청 유형 및 필수 입력값/,
    );
    assert.match(
      getRegistrationErrorMessage(
        requestError({ message: [{ path: ["toString"] }] }),
      ),
      /신청 유형 및 필수 입력값/,
    );
  });

  it("tells users to check submission history after ambiguous failures", () => {
    [
      new Error("response parse failed"),
      new AxiosError("timeout"),
      requestError({ message: "SQL private" }, 500),
      requestError({ message: { code: "UNKNOWN" } }),
      requestError({ message: "toString" }),
    ].forEach(error => {
      const message = getRegistrationErrorMessage(error);
      assert.match(message, /신청 내역을 확인한 뒤/);
      assert.doesNotMatch(message, /SQL private|지도교수|중복/);
    });
  });

  it("handles auth errors and existing deployed string responses", () => {
    assert.match(
      getRegistrationErrorMessage(requestError({}, 401)),
      /다시 로그인/,
    );
    assert.match(getRegistrationErrorMessage(requestError({}, 403)), /권한/);
    assert.match(
      getRegistrationErrorMessage(
        requestError({ message: "Student is delegate of the club" }),
      ),
      /대표자·대의원/,
    );
    assert.match(
      getRegistrationErrorMessage(
        requestError({ message: "your request already exists" }),
      ),
      /이번 학기에 제출한/,
    );
  });
});
