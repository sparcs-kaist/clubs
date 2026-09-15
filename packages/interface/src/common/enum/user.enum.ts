export enum ProfessorEnum {
  Assistant = 1, // 조교수
  Associate, // 부교수
  Full, // 정교수
}

export enum StudentStatusEnum {
  Attending = 1, // 재학
  LeaveOfAbsence, // 휴학
}

export enum UserTypeEnum {
  Undergraduate = "undergraduate",
  Master = "master",
  Doctor = "doctor",
  MasterDoctor = "masterDoctor",
  Executive = "executive",
  Professor = "professor",
  Employee = "employee",
}

export const studentUserTypes: readonly string[] = [
  UserTypeEnum.Undergraduate,
  UserTypeEnum.Master,
  UserTypeEnum.Doctor,
  UserTypeEnum.MasterDoctor,
];
