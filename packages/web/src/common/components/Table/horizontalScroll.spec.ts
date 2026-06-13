import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getCenteredHorizontalScrollLeft } from "./horizontalScroll.ts";

describe("getCenteredHorizontalScrollLeft", () => {
  it("centers overflowing table content", () => {
    assert.equal(getCenteredHorizontalScrollLeft(2400, 900), 750);
  });

  it("keeps non-overflowing table content at the start", () => {
    assert.equal(getCenteredHorizontalScrollLeft(900, 900), 0);
    assert.equal(getCenteredHorizontalScrollLeft(800, 900), 0);
  });
});
