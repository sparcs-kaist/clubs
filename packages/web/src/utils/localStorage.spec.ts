import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { setLoginTokens } from "./localStorage.ts";

describe("setLoginTokens", () => {
  const storage = new Map<string, string>();
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

  beforeEach(() => {
    storage.clear();
    storage.set("accessToken", "actor-executive");
    storage.set("responseToken", '{"executive":"actor-executive"}');
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: new EventTarget(),
    });
  });

  afterEach(() => {
    if (originalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalStorage);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("replaces both stored tokens so the old executive profile cannot be selected", () => {
    const tokens = { professor: "target-professor" };
    let notifications = 0;
    window.addEventListener("local-storage-set", () => {
      notifications += 1;
      assert.equal(storage.get("accessToken"), "target-professor");
      assert.deepEqual(JSON.parse(storage.get("responseToken") ?? ""), tokens);
    });
    setLoginTokens(tokens);
    assert.equal(storage.get("accessToken"), "target-professor");
    assert.deepEqual(JSON.parse(storage.get("responseToken") ?? ""), tokens);
    assert.equal(notifications, 1);
  });

  it("uses the normal login role priority for accounts with multiple roles", () => {
    const roles = [
      "professor",
      "doctor",
      "master",
      "undergraduate",
      "employee",
      "executive",
    ];
    roles.forEach((role, index) => {
      setLoginTokens(
        Object.fromEntries(roles.slice(index).map(key => [key, key])),
      );
      assert.equal(storage.get("accessToken"), role);
    });
  });

  it("does not retain the old identity when no login role is returned", () => {
    setLoginTokens({});
    assert.equal(storage.get("accessToken"), "");
    assert.equal(storage.get("responseToken"), "{}");
  });
});
