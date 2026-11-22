import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import {
  putReviewInternalMemo,
  REVIEW_INTERNAL_MEMO_MAX_LENGTH,
} from "@clubs/interface/api/review/endpoint/internalMemo";

import ActivityController from "@sparcs-clubs/api/feature/activity/controller/activity.controller";
import { ActivityNewRepository } from "@sparcs-clubs/api/feature/activity/repository/activity.new.repository";
import ActivityService from "@sparcs-clubs/api/feature/activity/service/activity.service.new";
import FundingController from "@sparcs-clubs/api/feature/funding/controller/funding.controller";
import FundingRepository from "@sparcs-clubs/api/feature/funding/repository/funding.repository";
import FundingService from "@sparcs-clubs/api/feature/funding/service/funding.service";

import { IS_PUBLIC_KEY, ROLES_KEY } from "../util/decorators/method-decorator";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));
jest.mock("@nestjs-cls/transactional", () => ({
  ...jest.requireActual("@nestjs-cls/transactional"),
  Transactional: () => () => undefined,
}));

const targets = [
  {
    kind: "activity",
    controller: ActivityController.prototype,
    servicePrototype: ActivityService.prototype,
    createRepository: (tx: object) =>
      new ActivityNewRepository({ tx } as never),
  },
  {
    kind: "funding",
    controller: FundingController.prototype,
    servicePrototype: FundingService.prototype,
    createRepository: (tx: object) =>
      new FundingRepository({ tx } as never, {} as never),
  },
] as const;

describe.each(targets)(
  "$kind internal memo",
  ({ kind, controller, createRepository, servicePrototype }) => {
    const id = 42;
    const memo = {
      content: "검토 중 메모",
      updatedAt: new Date("2026-11-23T09:00:00Z"),
      updatedBy: "집행부원",
    };
    const write = { ...memo, updatedByExecutiveId: 7 };

    function setup() {
      const parent = {
        findUnique: jest.fn().mockResolvedValue({ internalMemo: null }),
      };
      const memoTable = {
        upsert: jest.fn().mockResolvedValue(memo),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      };
      const repository = createRepository({
        [kind]: parent,
        [`${kind}InternalMemo`]: memoTable,
      });
      return { parent, memoTable, repository };
    }

    it("guards read, write and delete with the executive role", () => {
      const handlers = [
        controller.getExecutiveInternalMemo,
        controller.putExecutiveInternalMemo,
        controller.deleteExecutiveInternalMemo,
      ];
      handlers.forEach(handler => {
        expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(["executive"]);
        expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
      });
    });

    function setupService() {
      const repository = {
        getInternalMemo: jest.fn(),
        putInternalMemo: jest.fn().mockResolvedValue(memo),
        deleteInternalMemo: jest.fn(),
      };
      const users = {
        checkCurrentExecutive: jest.fn(),
        fetchExecutiveSummary: jest
          .fn()
          .mockResolvedValue({ name: memo.updatedBy }),
      };
      const service = Object.assign(
        Object.create(servicePrototype) as typeof servicePrototype,
        {
          [`${kind}Repository`]: repository,
          clock: { now: () => memo.updatedAt },
          userPublicService: users,
        },
      );
      return { service, repository, users };
    }

    it("blocks a former executive before accessing internal memo data", async () => {
      const { service, repository, users } = setupService();
      const forbidden = new ForbiddenException();
      users.checkCurrentExecutive.mockRejectedValue(forbidden);

      await expect(service.getExecutiveInternalMemo(id, 7)).rejects.toBe(
        forbidden,
      );
      await expect(
        service.putExecutiveInternalMemo(id, { content: memo.content }, 7),
      ).rejects.toBe(forbidden);
      await expect(service.deleteExecutiveInternalMemo(id, 7)).rejects.toBe(
        forbidden,
      );
      expect(users.fetchExecutiveSummary).not.toHaveBeenCalled();
      expect(repository.getInternalMemo).not.toHaveBeenCalled();
      expect(repository.putInternalMemo).not.toHaveBeenCalled();
      expect(repository.deleteInternalMemo).not.toHaveBeenCalled();
    });

    it("stores the authenticated executive's canonical name", async () => {
      const { service, repository, users } = setupService();

      await expect(
        service.putExecutiveInternalMemo(id, { content: memo.content }, 7),
      ).resolves.toEqual({ memo });
      expect(users.checkCurrentExecutive).toHaveBeenCalledWith(7);
      expect(users.fetchExecutiveSummary).toHaveBeenCalledWith(7);
      expect(repository.putInternalMemo).toHaveBeenCalledWith(id, write);
    });

    it("stores the memo against its item and deletes it by that item alone", async () => {
      const { parent, memoTable, repository } = setup();
      await expect(repository.getInternalMemo(id)).resolves.toBeNull();
      await expect(repository.putInternalMemo(id, write)).resolves.toEqual(
        memo,
      );
      parent.findUnique.mockResolvedValue({ internalMemo: memo });
      await expect(repository.getInternalMemo(id)).resolves.toEqual(memo);
      await repository.deleteInternalMemo(id);

      expect(parent.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id, deletedAt: null } }),
      );
      expect(memoTable.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { [`${kind}Id`]: id },
          create: { [`${kind}Id`]: id, ...write },
          update: write,
        }),
      );
      expect(memoTable.deleteMany).toHaveBeenCalledWith({
        where: { [`${kind}Id`]: id },
      });
    });

    it("rejects memo mutations on missing or deleted items", async () => {
      const { parent, memoTable, repository } = setup();
      parent.findUnique.mockResolvedValue(null);

      await expect(repository.putInternalMemo(id, write)).rejects.toThrow(
        NotFoundException,
      );
      await expect(repository.deleteInternalMemo(id)).rejects.toThrow(
        NotFoundException,
      );
      expect(memoTable.upsert).not.toHaveBeenCalled();
      expect(memoTable.deleteMany).not.toHaveBeenCalled();
    });

    it.each(["P2002", "P2034"])("retries a write conflict (%s)", async code => {
      const { service, repository, users } = setupService();
      repository.putInternalMemo.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("write conflict", {
          code,
          clientVersion: "test",
        }),
      );
      await expect(
        service.putExecutiveInternalMemo(id, { content: memo.content }, 7),
      ).resolves.toEqual({ memo });
      expect(users.checkCurrentExecutive).toHaveBeenCalledTimes(2);
      expect(repository.putInternalMemo).toHaveBeenCalledTimes(2);
    });
  },
);

describe("internal memo validation", () => {
  const { requestBody } = putReviewInternalMemo;

  it("trims submitted text and rejects blank or oversized text", () => {
    expect(requestBody.parse({ content: "  검토 중 메모  " })).toEqual({
      content: "검토 중 메모",
    });
    expect(requestBody.safeParse({ content: " " }).success).toBe(false);
    expect(
      requestBody.safeParse({
        content: "가".repeat(REVIEW_INTERNAL_MEMO_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});
