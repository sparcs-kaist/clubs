import { Clock } from "@sparcs-clubs/api/common/clock/clock";
import { RandomGenerator } from "@sparcs-clubs/api/common/random/random-generator";

import { Client } from "./sparcs-sso";

jest.mock("@sparcs-clubs/api/common/util/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("Client", () => {
  const clock = {
    now: jest.fn(() => new Date("2026-06-03T00:00:00.000Z")),
    endOfToday: jest.fn(() => new Date("2026-06-03T14:59:59.999Z")),
  } satisfies Clock;

  const randomGenerator = {
    uuid: jest.fn(() => "fixed-uuid"),
    hex: jest.fn(() => "fixed-state"),
  } satisfies RandomGenerator;

  it("uses the injected random generator for login state", () => {
    const client = new Client(
      "client-id",
      "secret-key",
      clock,
      randomGenerator,
    );

    const { state, url } = client.get_login_params();

    expect(randomGenerator.hex).toHaveBeenCalledWith(10);
    expect(state).toBe("fixed-state");
    expect(url).toContain("state=fixed-state");
  });

  it("uses the injected clock for signed URLs", () => {
    const client = new Client(
      "client-id",
      "secret-key",
      clock,
      randomGenerator,
    );

    const logoutUrl = client.get_logout_url("sid", "https://clubs.test");

    expect(logoutUrl).toContain("timestamp=1780444800");
  });
});
