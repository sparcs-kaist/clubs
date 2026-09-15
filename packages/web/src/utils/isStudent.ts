import { studentUserTypes } from "@clubs/interface/common/enum/user.enum";

import type { Profile } from "../common/providers/AuthContext";

const isStudent = (profile?: Profile) => {
  if (!profile) return false;
  return studentUserTypes.includes(profile.type);
};
export default isStudent;
