import { SystemRandomGenerator } from "./system-random-generator";

describe("SystemRandomGenerator", () => {
  it("returns a UUID string", () => {
    const randomGenerator = new SystemRandomGenerator();

    expect(randomGenerator.uuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
    );
  });

  it("returns a hex string with two characters per byte", () => {
    const randomGenerator = new SystemRandomGenerator();

    expect(randomGenerator.hex(5)).toMatch(/^[0-9a-f]{10}$/u);
  });
});
