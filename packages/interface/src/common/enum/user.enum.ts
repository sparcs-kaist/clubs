export { StudentEnum } from "@clubs/domain/user/student";

export const ProfessorEnum = {
  Assistant: 1, // 조교수
  Associate: 2, // 부교수
  Full: 3, // 정교수
} as const;

export type ProfessorEnum = (typeof ProfessorEnum)[keyof typeof ProfessorEnum];

export const StudentStatusEnum = {
  Attending: 1, // 재학
  LeaveOfAbsence: 2, // 휴학
} as const;

export type StudentStatusEnum =
  (typeof StudentStatusEnum)[keyof typeof StudentStatusEnum];

export const UserTypeEnum = {
  Undergraduate: "undergraduate",
  Master: "master",
  Doctor: "doctor",
  MasterDoctorDoctor: "masterDoctorDoctor",
  MasterDoctorMaster: "masterDoctorMaster",
  AllPrograms: "allPrograms",
  Auditor: "auditor",
  ExchangeStudent: "exchangeStudent",
  Executive: "executive",
  Professor: "professor",
  Employee: "employee",
} as const;

export type UserTypeEnum = (typeof UserTypeEnum)[keyof typeof UserTypeEnum];

export const studentUserTypes: readonly string[] = [
  UserTypeEnum.Undergraduate,
  UserTypeEnum.Master,
  UserTypeEnum.Doctor,
  UserTypeEnum.MasterDoctorDoctor,
  UserTypeEnum.MasterDoctorMaster,
  UserTypeEnum.AllPrograms,
  UserTypeEnum.Auditor,
  UserTypeEnum.ExchangeStudent,
];
