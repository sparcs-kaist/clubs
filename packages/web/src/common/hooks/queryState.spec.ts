import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readQueryValue, updateQueryValue } from "./queryState.ts";

describe("list query state", () => {
  it("restores valid pages and rejects invalid page numbers", () => {
    assert.equal(readQueryValue("3", 1), 3);
    [
      null,
      "",
      "0",
      "-1",
      "1.5",
      "3abc",
      "Infinity",
      "1e3",
      "9007199254740992",
    ].forEach(raw => {
      assert.equal(readQueryValue(raw, 1), 1);
    });
  });

  it("round trips Korean search text and reserved URL characters", () => {
    const text = "동아리 & 검색 #1 + / ?";
    const href = updateQueryValue(
      "https://clubs.test/clubs",
      "query",
      text,
      "",
    );
    const url = new URL(href, "https://clubs.test");
    assert.equal(readQueryValue(url.searchParams.get("query"), ""), text);
  });

  it("distinguishes no selected filters from the default all-selected state", () => {
    const defaults = ["문화, 예술", "체육"];
    assert.deepEqual(readQueryValue(null, defaults), defaults);
    assert.deepEqual(readQueryValue("[]", defaults), []);
    const href = updateQueryValue(
      "https://clubs.test/list",
      "division",
      ["문화, 예술"],
      defaults,
    );
    const url = new URL(href, "https://clubs.test");
    assert.deepEqual(
      readQueryValue(url.searchParams.get("division"), defaults),
      ["문화, 예술"],
    );
    ["broken", "null", "{}", "[1]", '["체육",true]'].forEach(raw => {
      assert.deepEqual(readQueryValue(raw, defaults), defaults);
    });
  });

  it("reads view toggles with a safe fallback", () => {
    assert.equal(readQueryValue("true", false), true);
    assert.equal(readQueryValue("false", true), false);
    assert.equal(readQueryValue("invalid", true), true);
  });

  it("preserves unrelated parameters and anchors and only resets the relevant page", () => {
    const href = updateQueryValue(
      "https://clubs.test/list?page=4&registrationPage=2&semesterId=9&type=3#past",
      "query",
      "검색",
      "",
      "page",
    );
    const url = new URL(href, "https://clubs.test");
    assert.equal(url.searchParams.get("page"), null);
    assert.equal(url.searchParams.get("registrationPage"), "2");
    assert.equal(url.searchParams.get("semesterId"), "9");
    assert.equal(url.searchParams.get("type"), "3");
    assert.equal(url.hash, "#past");
  });

  it("removes default values and keeps consecutive changes", () => {
    let url = new URL("https://clubs.test/list?semesterId=9");
    url = new URL(updateQueryValue(url.href, "page", 3, 1), url);
    url = new URL(updateQueryValue(url.href, "division", [], ["체육"]), url);
    assert.equal(url.searchParams.get("page"), "3");
    assert.equal(url.searchParams.get("division"), "[]");
    url = new URL(updateQueryValue(url.href, "page", 1, 1), url);
    url = new URL(
      updateQueryValue(url.href, "division", ["체육"], ["체육"]),
      url,
    );
    assert.equal(url.search, "?semesterId=9");
  });
});
