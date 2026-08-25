import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

const cancelableClubTypes = [ClubTypeEnum.Regular, ClubTypeEnum.Provisional];

const canCancelClubRegistration = (
  userType: UserTypeEnum | undefined,
  clubType: ClubTypeEnum,
) =>
  userType === UserTypeEnum.Executive && cancelableClubTypes.includes(clubType);

export default canCancelClubRegistration;
