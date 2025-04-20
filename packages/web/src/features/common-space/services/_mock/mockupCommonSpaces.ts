import { ApiCms001ResponseOK } from "@clubs/interface/api/common-space/endpoint/apiCms001";
import { CommonSpaceEnum } from "@clubs/interface/common/enum/commonSpace.enum";

const mockupCommonSpaces: ApiCms001ResponseOK = {
  commonSpaces: [
    {
      id: 1,
      name: "Common Space 1",
      commonSpaceEnum: CommonSpaceEnum.NotUsed,
      availableHoursPerWeek: 10,
      availableHoursPerDay: 4,
    },
    {
      id: 2,
      name: "Common Space 2",
      commonSpaceEnum: CommonSpaceEnum.NotUsed,
      availableHoursPerWeek: 12,
      availableHoursPerDay: 4,
    },
    {
      id: 3,
      name: "Common Space 3",
      commonSpaceEnum: CommonSpaceEnum.NotUsed,
      availableHoursPerWeek: 13,
      availableHoursPerDay: 4,
    },
    {
      id: 4,
      name: "Common Space 4",
      commonSpaceEnum: CommonSpaceEnum.NotUsed,
      availableHoursPerWeek: 10,
      availableHoursPerDay: 4,
    },
  ],
};
export default mockupCommonSpaces;
