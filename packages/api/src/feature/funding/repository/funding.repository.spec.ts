import { buildFundingTransportationPassengerWhere } from "./funding.repository.util";

describe("buildFundingTransportationPassengerWhere", () => {
  it("shows submitted transportation passengers without student_t filtering", () => {
    expect(buildFundingTransportationPassengerWhere(4216)).toEqual({
      fundingId: 4216,
      deletedAt: null,
      funding: {
        deletedAt: null,
      },
      student: {
        deletedAt: null,
      },
    });
  });
});
