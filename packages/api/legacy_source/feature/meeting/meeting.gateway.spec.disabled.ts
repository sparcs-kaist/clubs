import { Test, TestingModule } from "@nestjs/testing";

import { MeetingGateway } from "./meeting.gateway";

describe("SocketGateway", () => {
  let gateway: MeetingGateway;

  // before all test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeetingGateway],
    }).compile();

    gateway = module.get<MeetingGateway>(MeetingGateway);
  });

  it("should be defined", () => {
    // eslint-disable-next-line jest/valid-expect
    expect(gateway);
  });
});
