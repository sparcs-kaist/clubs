import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeTableCellCopyText } from "./cellCopy.ts";

describe("normalizeTableCellCopyText", () => {
  it("keeps visible cell content while collapsing layout whitespace", () => {
    assert.equal(
      normalizeTableCellCopyText(
        "  대표자/KAIST E-Mail\n\n user@kaist.ac.kr  ",
      ),
      "대표자/KAIST E-Mail user@kaist.ac.kr",
    );
  });

  it("returns an empty string for whitespace-only cells", () => {
    assert.equal(normalizeTableCellCopyText(" \n\t "), "");
  });
});
