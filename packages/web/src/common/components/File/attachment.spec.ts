import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getFilePreviewType, openFileInNewTab } from "./attachment";

describe("getFilePreviewType", () => {
  it("classifies PDF files separately from unsupported files", () => {
    assert.equal(
      getFilePreviewType({
        id: "file-1",
        name: "evidence.PDF",
        url: "https://example.com/evidence.pdf",
      }),
      "pdf",
    );
  });

  it("keeps image files in the image preview path", () => {
    assert.equal(
      getFilePreviewType({
        id: "file-2",
        name: "photo.jpg",
        url: "https://example.com/photo.jpg",
      }),
      "image",
    );
  });

  it("classifies unknown extensions as unsupported", () => {
    assert.equal(
      getFilePreviewType({
        id: "file-3",
        name: "receipt.xlsx",
        url: "https://example.com/receipt.xlsx",
      }),
      "unsupported",
    );
  });

  it("opens a file in a browser preview tab without sending referrer information", () => {
    const calls: string[][] = [];

    openFileInNewTab(
      {
        id: "file-4",
        name: "evidence.pdf",
        url: "https://example.com/evidence.pdf",
      },
      (url, target, features) => {
        calls.push([url, target, features]);
      },
    );

    assert.deepEqual(calls, [
      ["https://example.com/evidence.pdf", "_blank", "noopener,noreferrer"],
    ]);
  });
});
