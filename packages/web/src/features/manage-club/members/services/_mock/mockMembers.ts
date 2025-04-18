import { ApiReg008ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg008";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { Semester } from "@sparcs-clubs/web/types/semester";

export const mockRegisterMembers: ApiReg008ResponseOk = {
  applies: [
    {
      id: 1,
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
      createdAt: new Date("2024-03-04T21:00:00"),
      student: {
        id: 1,
        name: "이지윤",
        studentNumber: 20200510,
        email: "nicolelee2001@kaist.ac.kr",
        phoneNumber: "010-1234-5678",
      },
    },
    {
      id: 2,
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
      createdAt: new Date("2024-03-04T21:00:00"),
      student: {
        id: 2,
        name: "박지호",
        studentNumber: 20200510,
        email: "nicolelee2001@kaist.ac.kr",
        phoneNumber: "010-1234-5678",
      },
    },
    {
      id: 3,
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
      createdAt: new Date("2024-03-04T21:00:00"),
      student: {
        id: 3,
        name: "박병찬",
        studentNumber: 20200510,
        email: "nicolelee2001@kaist.ac.kr",
        phoneNumber: "010-1234-5678",
      },
    },
    {
      id: 4,
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Approved,
      createdAt: new Date("2024-03-04T21:00:00"),
      student: {
        id: 4,
        name: "이도라",
        studentNumber: 20200510,
        email: "nicolelee2001@kaist.ac.kr",
        phoneNumber: "010-1234-5678",
      },
    },
    {
      id: 5,
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Rejected,
      createdAt: new Date("2024-03-04T21:00:00"),
      student: {
        id: 5,
        name: "이지윤",
        studentNumber: 20200510,
        email: "nicolelee2001@kaist.ac.kr",
        phoneNumber: "010-1234-5678",
      },
    },
  ],
};

export interface MockAllSemestersResponse {
  semesters: Semester[];
}

export const mockAllSemesters: MockAllSemestersResponse = {
  semesters: [
    {
      id: 1,
      year: 2020,
      name: "봄",
      startTerm: new Date("2020-03-01"),
      endTerm: new Date("2020-06-01"),
    },
    {
      id: 2,
      year: 2020,
      name: "가을",
      startTerm: new Date("2020-09-01"),
      endTerm: new Date("2020-12-01"),
    },
    {
      id: 3,
      year: 2021,
      name: "봄",
      startTerm: new Date("2021-03-01"),
      endTerm: new Date("2021-06-01"),
    },
    {
      id: 4,
      year: 2021,
      name: "가을",
      startTerm: new Date("2021-09-01"),
      endTerm: new Date("2021-12-01"),
    },
    {
      id: 5,
      year: 2022,
      name: "봄",
      startTerm: new Date("2022-03-01"),
      endTerm: new Date("2022-06-01"),
    },
    {
      id: 6,
      year: 2022,
      name: "가을",
      startTerm: new Date("2022-09-01"),
      endTerm: new Date("2022-12-01"),
    },
    {
      id: 7,
      year: 2023,
      name: "봄",
      startTerm: new Date("2023-03-01"),
      endTerm: new Date("2023-06-01"),
    },
    {
      id: 8,
      year: 2023,
      name: "가을",
      startTerm: new Date("2023-09-01"),
      endTerm: new Date("2023-12-01"),
    },
    {
      id: 9,
      year: 2024,
      name: "봄",
      startTerm: new Date("2024-03-01"),
      endTerm: new Date("2024-06-01"),
    },
  ],
};

export interface MockSemesterMembersResponse {
  members: {
    studentNumber: number;
    name: string;
    email: string;
    phoneNumber?: string;
  }[];
}

export const mockSemesterMembers: MockSemesterMembersResponse = {
  members: [
    {
      studentNumber: 20210001,
      name: "일지윤",
      email: "iljiyun_01@example.com",
    },
    {
      studentNumber: 20210002,
      name: "이지윤",
      email: "leejiyun_02@example.com",
      phoneNumber: "010-1234-5678",
    },
    {
      studentNumber: 20210003,
      name: "삼지윤",
      email: "samjiyun_03@example.com",
    },
    {
      studentNumber: 20210004,
      name: "사지윤",
      email: "sajiyn_04@example.com",
      phoneNumber: "010-2345-6789",
    },
    {
      studentNumber: 20210005,
      name: "오지윤",
      email: "ohjiyun_05@example.com",
    },
    {
      studentNumber: 20210006,
      name: "일지윤",
      email: "iljiyun_06@example.com",
      phoneNumber: "010-3456-7890",
    },
    {
      studentNumber: 20210007,
      name: "이지윤",
      email: "leejiyun_07@example.com",
    },
    {
      studentNumber: 20210008,
      name: "삼지윤",
      email: "samjiyun_08@example.com",
      phoneNumber: "010-4567-8901",
    },
    { studentNumber: 20210009, name: "사지윤", email: "sajiyn_09@example.com" },
    {
      studentNumber: 20210010,
      name: "오지윤",
      email: "ohjiyun_10@example.com",
      phoneNumber: "010-5678-9012",
    },
    {
      studentNumber: 20210011,
      name: "일지윤",
      email: "iljiyun_11@example.com",
    },
    {
      studentNumber: 20210012,
      name: "이지윤",
      email: "leejiyun_12@example.com",
      phoneNumber: "010-6789-0123",
    },
    {
      studentNumber: 20210013,
      name: "삼지윤",
      email: "samjiyun_13@example.com",
    },
    {
      studentNumber: 20210014,
      name: "사지윤",
      email: "sajiyn_14@example.com",
      phoneNumber: "010-7890-1234",
    },
    {
      studentNumber: 20210015,
      name: "오지윤",
      email: "ohjiyun_15@example.com",
    },
  ],
};
