import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, it } from "node:test";

const { registerHooks } = createRequire(import.meta.url)("node:module");
const aliasHook = registerHooks({
  resolve(
    specifier: string,
    context: unknown,
    nextResolve: (nextSpecifier: string, nextContext: unknown) => unknown,
  ) {
    const prefix = "@sparcs-clubs/web/utils/";
    const target = specifier.startsWith(prefix)
      ? new URL(
          `../../../utils/${specifier.slice(prefix.length)}.ts`,
          import.meta.url,
        ).href
      : specifier;
    return nextResolve(target, context);
  },
});
const { hideProfessorApprovalNoticeToday, isProfessorApprovalNoticeHidden } =
  await import("./professorApprovalNoticeStorage.ts");
aliasHook.deregister();

describe("professor approval notice storage", () => {
  const storage = new Map<string, string>();
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const key = "professor-pending-approval-hidden-date:1";
  const beforeMidnight = new Date("2026-09-15T14:59:59.999Z");
  const midnight = new Date("2026-09-15T15:00:00.000Z");

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (name: string) => storage.get(name) ?? null,
        setItem: (name: string, value: string) => storage.set(name, value),
        removeItem: (name: string) => storage.delete(name),
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

  it("shows without a saved date and hides only the selected account today", () => {
    assert.equal(isProfessorApprovalNoticeHidden(1, beforeMidnight), false);
    hideProfessorApprovalNoticeToday(1, beforeMidnight);
    assert.equal(storage.get(key), "2026.09.15");
    assert.equal(isProfessorApprovalNoticeHidden(1, beforeMidnight), true);
    assert.equal(isProfessorApprovalNoticeHidden(2, beforeMidnight), false);
    assert.equal(storage.get(key), "2026.09.15");
  });

  it("removes yesterday's value at KST midnight and can save the new day", () => {
    hideProfessorApprovalNoticeToday(1, beforeMidnight);
    assert.equal(isProfessorApprovalNoticeHidden(1, midnight), false);
    assert.equal(storage.has(key), false);
    hideProfessorApprovalNoticeToday(1, midnight);
    assert.equal(storage.get(key), "2026.09.16");
    assert.equal(isProfessorApprovalNoticeHidden(1, midnight), true);
  });

  it("removes invalid and future values without removing another account's date", () => {
    hideProfessorApprovalNoticeToday(2, midnight);
    ["", "invalid", "2026.09.17"].forEach(value => {
      storage.set(key, value);
      assert.equal(isProfessorApprovalNoticeHidden(1, midnight), false);
      assert.equal(storage.has(key), false);
      assert.equal(isProfessorApprovalNoticeHidden(2, midnight), true);
    });
  });

  it("keeps the notice usable when storage reads, writes, or cleanup fail", () => {
    ["getItem", "setItem", "removeItem"].forEach(method => {
      const originalMethod = localStorage[method as keyof Storage];
      storage.set(key, "2026.09.15");
      Object.defineProperty(localStorage, method, {
        configurable: true,
        value: () => {
          throw new Error("Storage is unavailable");
        },
      });
      assert.equal(isProfessorApprovalNoticeHidden(1, midnight), false);
      assert.doesNotThrow(() => hideProfessorApprovalNoticeToday(1, midnight));
      Object.defineProperty(localStorage, method, { value: originalMethod });
    });
  });

  it("tolerates restricted storage access and server rendering", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("Storage access is blocked");
      },
    });
    assert.equal(isProfessorApprovalNoticeHidden(1, midnight), false);
    assert.doesNotThrow(() => hideProfessorApprovalNoticeToday(1, midnight));
    Reflect.deleteProperty(globalThis, "window");
    assert.equal(isProfessorApprovalNoticeHidden(1, midnight), false);
  });
});
