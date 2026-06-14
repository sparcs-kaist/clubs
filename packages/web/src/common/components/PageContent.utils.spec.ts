import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isProductionReadyPath } from "./PageContent.utils.ts";

describe("isProductionReadyPath", () => {
  it("matches exact routes by equality instead of reverse prefix", () => {
    const allowlist = {
      exact: ["/manage-club"],
      startsWith: [],
      exclude: [],
    };

    assert.equal(isProductionReadyPath("/manage-club", allowlist), true);
    assert.equal(isProductionReadyPath("/manage", allowlist), false);
  });

  it("allows routes under startsWith prefixes", () => {
    const allowlist = {
      exact: [],
      startsWith: ["/executive/funding"],
      exclude: [],
    };

    assert.equal(isProductionReadyPath("/executive/funding", allowlist), true);
    assert.equal(
      isProductionReadyPath("/executive/funding/semester/1", allowlist),
      true,
    );
  });

  it("lets exclude override exact and startsWith matches", () => {
    const allowlist = {
      exact: ["/example"],
      startsWith: ["/meeting"],
      exclude: ["/example", "/meeting/agenda/create"],
    };

    assert.equal(isProductionReadyPath("/example", allowlist), false);
    assert.equal(
      isProductionReadyPath("/meeting/agenda/create", allowlist),
      false,
    );
    assert.equal(isProductionReadyPath("/meeting/1", allowlist), true);
  });
});
