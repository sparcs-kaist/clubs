import apiAut005 from "@clubs/interface/api/auth/endpoint/apiAut005";
import apiAut006 from "@clubs/interface/api/auth/endpoint/apiAut006";

describe("exchange login request contracts", () => {
  it.each([
    ["email", " professor@example.com ", "professor@example.com"],
    ["studentId", " 123 ", "123"],
    ["studentNumber", "20260001", "20260001"],
    ["professorId", "2147483647", "2147483647"],
  ])("accepts and trims %s searches", (type, value, expected) => {
    expect(apiAut005.requestQuery.parse({ type, value })).toEqual({
      type,
      value: expected,
    });
  });

  it.each(["studentId", "studentNumber", "professorId"])(
    "rejects invalid or out-of-range %s searches",
    type => {
      [
        "",
        " ",
        "0",
        "-1",
        "1.5",
        "1e2",
        "Infinity",
        "NaN",
        "12abc",
        "2147483648",
        "9007199254740993",
        123,
        null,
        undefined,
      ].forEach(value => {
        expect(apiAut005.requestQuery.safeParse({ type, value }).success).toBe(
          false,
        );
      });
    },
  );

  it.each([
    {},
    { type: "userId", value: "123" },
    { type: "name", value: "홍길동" },
    { type: "email", value: "invalid-email" },
    { type: "email", value: "" },
    { type: "email", value: ["person@example.com"] },
    { type: "email", value: `${"a".repeat(245)}@example.com` },
  ])("rejects malformed or unsupported search %j", query => {
    expect(apiAut005.requestQuery.safeParse(query).success).toBe(false);
  });

  it.each([1, 123, 2147483647])(
    "accepts selected numeric userId %s",
    userId => {
      expect(apiAut006.requestBody.parse({ userId })).toEqual({ userId });
    },
  );

  it.each(
    [
      0,
      -1,
      1.5,
      2147483648,
      Infinity,
      NaN,
      "123",
      null,
      undefined,
      true,
      [1],
      {},
    ].map(userId => [userId]),
  )("rejects invalid selected userId %s", userId => {
    expect(apiAut006.requestBody.safeParse({ userId }).success).toBe(false);
  });
});
