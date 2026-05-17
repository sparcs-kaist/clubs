import { buildFundingTransportationPassengerFindManyArgs } from "./funding.repository.util";

describe("buildFundingTransportationPassengerFindManyArgs", () => {
  it("shows submitted distinct transportation passengers without student_t filtering", () => {
    expect(buildFundingTransportationPassengerFindManyArgs(4216)).toEqual({
      distinct: ["studentId"],
      where: {
        fundingId: 4216,
        deletedAt: null,
        funding: {
          deletedAt: null,
        },
        student: {
          deletedAt: null,
        },
      },
      select: {
        studentId: true,
      },
    });
  });
});
