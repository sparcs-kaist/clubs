import type { ApiReg006ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg006";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

/* API 문서에는 AppliedStatusEum으로 명명되어 있는데 관련 enum이 없어서 RegistraionStatusEum으로 구현함 */

// id: z.coerce.number().int().min(1),
//       clubId: z.coerce.number().int().min(1),
//       clubNameKr: zClubName,
//       type: z.nativeEnum(ClubTypeEnum), // 동아리 유형(정동아리 | 가동아리)
//       isPermanent: z.coerce.boolean(), // 상임동아리 여부
//       divisionName: z.string().max(128),
//       applyStatusEnumId: z.nativeEnum(
//         RegistrationApplicationStudentStatusEnum,
//       ),
const mockupRegistraion: ApiReg006ResponseOk = {
  applies: [
    {
      id: 1,
      clubId: 1,
      clubNameKr: "테스트 동아리",
      type: ClubTypeEnum.Regular,
      isPermanent: false,
      divisionName: "테스트 동아리",
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Approved,
    },
    {
      id: 2,
      clubId: 2,
      clubNameKr: "테스트 동아리",
      type: ClubTypeEnum.Regular,
      isPermanent: true,
      divisionName: "테스트 동아리",
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Approved,
    },
    {
      id: 3,
      clubId: 3,
      clubNameKr: "테스트 동아리",
      type: ClubTypeEnum.Provisional,
      isPermanent: false,
      divisionName: "테스트 동아리",
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Approved,
    },
  ],
};

export default mockupRegistraion;
