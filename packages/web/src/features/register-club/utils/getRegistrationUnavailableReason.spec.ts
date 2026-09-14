import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { getRegistrationUnavailableReason } from "./getRegistrationUnavailableReason.ts";

type Input = Parameters<typeof getRegistrationUnavailableReason>[0];
const ready = <T>(data: T) => ({
  data,
  isFetchedAfterMount: true,
  isFetching: false,
  isError: false,
});
const makeInput = (): Input => ({
  type: RegistrationTypeEnum.NewProvisional,
  isUndergraduate: true,
  available: ready({ club: null }),
  applications: ready({ registrations: [] }),
  deadline: ready({
    semester: {
      id: 1,
      year: 2026,
      name: "가을",
      startTerm: new Date(0),
      endTerm: new Date(10000),
    },
    deadline: { startDate: new Date(1000), endTerm: new Date(2000) },
  }),
  now: 1500,
});
const withClub = (types: RegistrationTypeEnum[]): Input => ({
  ...makeInput(),
  available: ready({
    club: {
      id: 1,
      name: "카이스트 크로니클",
      nameEn: "KAIST Chronicles",
      typeEnum: ClubTypeEnum.Regular,
      division: { id: 1, name: "문화" },
      availableRegistrationTypeEnums: types,
    },
  }),
});
const types = [
  RegistrationTypeEnum.Renewal,
  RegistrationTypeEnum.Promotional,
  RegistrationTypeEnum.NewProvisional,
  RegistrationTypeEnum.ReProvisional,
];

describe("registration entry and direct URL eligibility", () => {
  it("allows only new provisional registration for an explicit club:null", () => {
    types.forEach(type => {
      assert.equal(
        getRegistrationUnavailableReason({ ...makeInput(), type }) === null,
        type === RegistrationTypeEnum.NewProvisional,
      );
    });
  });

  it("uses exact server types and keeps re-provisional available to regular clubs", () => {
    [
      RegistrationTypeEnum.Renewal,
      RegistrationTypeEnum.Promotional,
      RegistrationTypeEnum.ReProvisional,
    ].forEach(allowed => {
      types.forEach(type => {
        assert.equal(
          getRegistrationUnavailableReason({ ...withClub([allowed]), type }) ===
            null,
          type === allowed,
        );
      });
    });
    types.forEach(type =>
      assert.notEqual(
        getRegistrationUnavailableReason({ ...withClub([]), type }),
        null,
      ),
    );
  });

  it("fails closed for missing, cached, refetching and failed query results", () => {
    const keys = ["available", "applications", "deadline"] as const;
    keys.forEach(key => {
      const changes = [
        { data: undefined },
        { isFetchedAfterMount: false },
        { isFetching: true },
        { isError: true },
      ];
      changes.forEach(change => {
        const input = makeInput();
        input[key] = { ...input[key], ...change } as never;
        assert.notEqual(
          getRegistrationUnavailableReason(input),
          null,
          `${key}: ${JSON.stringify(change)}`,
        );
      });
    });
  });

  it("rejects unauthenticated or non-undergraduate access and any existing application", () => {
    assert.notEqual(
      getRegistrationUnavailableReason({
        ...makeInput(),
        isUndergraduate: false,
      }),
      null,
    );
    [1, 2, 3].forEach(registrationStatusEnum => {
      const applications = ready({
        registrations: [{ id: 1, registrationStatusEnum }],
      });
      assert.notEqual(
        getRegistrationUnavailableReason({ ...makeInput(), applications }),
        null,
      );
    });
  });

  it("opens at the start and closes at the submission deadline, rejecting invalid dates", () => {
    [999, 2000, 2001].forEach(now =>
      assert.notEqual(
        getRegistrationUnavailableReason({ ...makeInput(), now }),
        null,
      ),
    );
    [1000, 1999].forEach(now =>
      assert.equal(
        getRegistrationUnavailableReason({ ...makeInput(), now }),
        null,
      ),
    );
    const input = makeInput();
    input.deadline.data!.deadline = null;
    assert.notEqual(getRegistrationUnavailableReason(input), null);
    input.deadline.data!.deadline = {
      startDate: new Date("invalid"),
      endTerm: new Date(2000),
    };
    assert.notEqual(getRegistrationUnavailableReason(input), null);
  });
});
