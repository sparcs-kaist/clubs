import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { TransactionHost } from "@nestjs-cls/transactional";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { TransactionModule } from "./transaction.module";

jest.mock("@sparcs-clubs/api/env", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

describe("TransactionModule", () => {
  let module: TestingModule;

  afterEach(async () => {
    await module?.close();
  });

  it("registers a TransactionHost backed by PrismaService", async () => {
    module = await Test.createTestingModule({
      imports: [TransactionModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $transaction: jest.fn(),
      })
      .compile();

    expect(module.get(TransactionHost)).toBeInstanceOf(TransactionHost);
  });
});
