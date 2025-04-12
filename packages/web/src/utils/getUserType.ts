import {
  ProfessorEnum,
  UserTypeEnum,
} from "@clubs/interface/common/enum/user.enum";

export const getUserType = (type: UserTypeEnum | string) => {
  switch (type) {
    case UserTypeEnum.Undergraduate || "undergraduate":
      return "학부생";
    case UserTypeEnum.Master || "master":
      return "석사과정";
    case UserTypeEnum.Doctor || "doctor":
      return "박사과정";
    case UserTypeEnum.Executive || "executive":
      return "집행부원";
    case UserTypeEnum.Professor || "professor":
      return "지도교수";
    case UserTypeEnum.Employee || "employee":
      return "교직원";
    default:
      return "None";
  }
};

export function getUserTypeEnumKeyByValue(
  value: string,
): keyof typeof UserTypeEnum | undefined {
  return (Object.keys(UserTypeEnum) as Array<keyof typeof UserTypeEnum>).find(
    key => UserTypeEnum[key] === value,
  );
}

export const professorEnumToText = (profEnum?: ProfessorEnum) => {
  switch (profEnum) {
    case ProfessorEnum.Assistant:
      return "조교수";
    case ProfessorEnum.Associate:
      return "부교수";
    case ProfessorEnum.Full:
    default:
      return "정교수";
  }
};
