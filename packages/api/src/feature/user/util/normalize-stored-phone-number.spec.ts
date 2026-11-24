import { normalizeStoredPhoneNumber } from "./normalize-stored-phone-number";

describe("normalizeStoredPhoneNumber", () => {
  it.each([
    [null, null],
    ["  ", null],
    [" 01012345678 ", "010-1234-5678"],
    ["010-1234-5678", "010-1234-5678"],
    ["042-123-4567", "042-123-4567"],
  ])("maps the stored value %s to %s", (value, expected) => {
    expect(normalizeStoredPhoneNumber(value)).toBe(expected);
  });
});
