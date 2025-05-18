import { ApiDiv005ResponseOk } from "@clubs/interface/api/division/endpoint/apiDiv005";

import { ChangeDivisionPresidentStatusEnum } from "@sparcs-clubs/web/constants/changeDivisionPresident";

export const mockMyDivisionPresidentRequest: ApiDiv005ResponseOk = {
  requests: [
    {
      id: 1,
      divisionName: {
        id: 1,
        name: "'생활체육' 분과",
      },
      prevStudent: {
        name: "박병찬",
        studentNumber: 20210227,
      },
      changeDivisionPresidentStatusEnumId:
        ChangeDivisionPresidentStatusEnum.Requested,
    },
  ],
};
