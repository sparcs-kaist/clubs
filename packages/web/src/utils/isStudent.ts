import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { Profile } from "../common/providers/AuthContext";

const isStudent = (profile?: Profile) => {
  if (!profile) return false;
  return (
    profile.type === UserTypeEnum.Undergraduate ||
    profile.type === UserTypeEnum.Master ||
    profile.type === UserTypeEnum.Doctor
  );
};
export default isStudent;
