import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import type { RegisterClubModel } from "../types/registerClub";

const { registerHooks } = createRequire(import.meta.url)("node:module");
const aliasHook = registerHooks({
  resolve(
    specifier: string,
    context: unknown,
    nextResolve: (nextSpecifier: string, nextContext: unknown) => unknown,
  ) {
    const target =
      specifier === "@sparcs-clubs/web/constants/localStorage"
        ? new URL("../../../constants/localStorage.ts", import.meta.url).href
        : specifier;
    return nextResolve(target, context);
  },
});
const { getCompatibleRegistrationDraft, getRegisterClubDraftKey } =
  await import("./registrationDraft.ts");
aliasHook.deregister();

const types = [
  RegistrationTypeEnum.Renewal,
  RegistrationTypeEnum.Promotional,
  RegistrationTypeEnum.NewProvisional,
  RegistrationTypeEnum.ReProvisional,
];

const makeDraft = (type: RegistrationTypeEnum) =>
  ({
    registrationTypeEnumId: type,
    clubId: 42,
    clubNameKr: "카이스트 크로니클",
    clubNameEn: "KAIST Chronicles",
    foundedAt: "2026-03-01T00:00:00.000Z",
    activityPlanFile: {
      id: "attachment-id",
      name: "plan.pdf",
      url: "/plan.pdf",
    },
  }) as unknown as RegisterClubModel;

describe("registration drafts", () => {
  it("stores all four registration types separately", () => {
    assert.equal(new Set(types.map(getRegisterClubDraftKey)).size, 4);
  });

  it("never restores a different type, including the old shared draft", () => {
    types.forEach(savedType => {
      types.forEach(selectedType => {
        const restored = getCompatibleRegistrationDraft(
          makeDraft(savedType),
          selectedType,
        );
        assert.equal(restored !== undefined, savedType === selectedType);
      });
    });
    assert.equal(
      getCompatibleRegistrationDraft(undefined, types[0]),
      undefined,
    );
    assert.equal(
      getCompatibleRegistrationDraft({} as RegisterClubModel, types[0]),
      undefined,
    );
  });

  it("removes an old club id only for a new provisional application", () => {
    types.forEach(type => {
      const draft = makeDraft(type);
      const restored = getCompatibleRegistrationDraft(draft, type);
      assert.equal(
        restored?.clubId,
        type === RegistrationTypeEnum.NewProvisional ? undefined : 42,
      );
      assert.equal(draft.clubId, 42);
    });
  });

  it("restores dates, user-entered names, and attachments without mutating storage", () => {
    const draft = makeDraft(RegistrationTypeEnum.ReProvisional);
    const restored = getCompatibleRegistrationDraft(
      draft,
      RegistrationTypeEnum.ReProvisional,
    );
    assert.equal(restored?.foundedAt.toISOString(), "2026-03-01T00:00:00.000Z");
    assert.equal(restored?.clubNameEn, "KAIST Chronicles");
    assert.deepEqual(restored?.activityPlanFile, draft.activityPlanFile);
    assert.equal(typeof draft.foundedAt, "string");
  });
});
