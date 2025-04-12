import { ApiReg020ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg020";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

const registerState = [
  RegistrationApplicationStudentStatusEnum.Approved,
  RegistrationApplicationStudentStatusEnum.Pending,
  RegistrationApplicationStudentStatusEnum.Rejected,
];

const studentIDList = [
  20240024, // 1
  20230120, // 1
  20247893, // 3
  20246493, // 1
  20245642, // 2
];

const regularMemberState = [true, false];

const items = Array.from({ length: 100 }, (_, index) => ({
  memberRegistrationId: index + 1,
  RegistrationApplicationStudentStatusEnumId:
    registerState[index % registerState.length],
  isRegularMemberRegistration:
    regularMemberState[index % regularMemberState.length],
  student: {
    id: 1,
    studentNumber: studentIDList[index % studentIDList.length],
    name: "임가은",
    phoneNumber: "010-1234-5678",
    email: "casio@sparcs.org",
  },
}));

export const mockupClubMemberRegister: ApiReg020ResponseOk = {
  totalRegistrations: 100,
  totalWaitings: 20,
  totalApprovals: 70,
  totalRejections: 10,
  regularMemberRegistrations: 50,
  regularMemberWaitings: 10,
  regularMemberApprovals: 35,
  regularMemberRejections: 5,
  items,
  total: items.length,
  offset: 1,
};
