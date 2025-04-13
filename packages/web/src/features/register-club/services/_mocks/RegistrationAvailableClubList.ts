import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";

import { ClubRegistrationInfo } from "@sparcs-clubs/web/features/register-club/types/registerClub";

export const MockRegistrationAvailableClubList: ClubRegistrationInfo[] = [
  {
    id: 1,
    clubNameKr: "동아리1",
    clubNameEn: "club1",
    professor: {
      name: "교수1",
      email: "professor1@kaist.ac.kr",
      professorEnumId: ProfessorEnum.Full,
    },
  },
  {
    id: 2,
    clubNameKr: "동아리2",
    clubNameEn: "club2",
    professor: {
      name: "교수2",
      email: "professor2@kaist.ac.kr",
      professorEnumId: ProfessorEnum.Associate,
    },
  },
  {
    id: 3,
    clubNameKr: "동아리3",
    clubNameEn: "club3",
  },
];
