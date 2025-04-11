import type { ApiAcf003ResponseOk } from "@sparcs-clubs/interface/api/activity-certificate/endpoint/apiAcf003";
import type { ApiClb004ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb004";
import type { ApiClb010ResponseOk } from "@sparcs-clubs/interface/api/club/endpoint/apiClb010";
import type { ApiCms006ResponseOk } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms006";
import type { ApiPrt001ResponseOk } from "@sparcs-clubs/interface/api/promotional-printing/endpoint/apiPrt001";
import type { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import type { ApiRnt003ResponseOK } from "@sparcs-clubs/interface/api/rental/endpoint/apiRnt003";
import { ActivityCertificateOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/activityCertificate.enum";
import { CommonSpaceUsageOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/commonSpace.enum";
import { FundingStatusEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";
import {
  PromotionalPrintingOrderStatusEnum,
  PromotionalPrintingSizeEnum,
} from "@sparcs-clubs/interface/common/enum/promotionalPrinting.enum";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import { RentalOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/rental.enum";

import { NewFundingData } from "@sparcs-clubs/web/features/manage-club/funding/types/funding";

export interface Activity {
  id: number;
  status: number;
  professorApproval: number;
  name: string;
  type: number;
  startDate: Date;
  endTerm: Date;
}

export interface Funding {
  id: number;
  status: number;
  name: string;
  itemName: string;
  requestedAmount: number;
  approvedAmount: number | null;
}

export enum ActivityStatusEnum {
  Applied = 1, // 신청
  Committee, // 운위
  Approved, // 승인
  Rejected, // 반려
}

export enum ActivityProfessorApprovalEnum {
  Requested = 1, // 대기
  Approved, // 완료
  Denied, // 반려
}

export enum MemberStatusEnum {
  Applied = 1, // 신청
  Approved, // 승인
  Rejected, // 반려
}
const mockClubDescription: ApiClb004ResponseOK = {
  description: "동아리 설명입니다",
  roomPassword: "password",
};

const mockClubMembers: ApiClb010ResponseOk = {
  members: [
    {
      studentId: 1,
      studentNumber: 20200510,
      name: "이지윤",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
    {
      studentId: 2,
      studentNumber: 20200511,
      name: "박지호",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
    {
      studentId: 3,
      studentNumber: 20200512,
      name: "박병찬",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
    {
      studentId: 4,
      studentNumber: 20200001,
      name: "일지윤",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
    {
      studentId: 5,
      studentNumber: 20200002,
      name: "이지윤",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
    {
      studentId: 6,
      studentNumber: 20200003,
      name: "삼지윤",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
    {
      studentId: 7,
      studentNumber: 20200004,
      name: "사지윤",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
    {
      studentId: 8,
      studentNumber: 20200005,
      name: "오지윤",
      email: "test@kaist.ac.kr",
      phoneNumber: "010-1234-5678",
    },
  ],
};

const mockupManageMems: ApiReg008ResponseOk["applies"][0][] = [
  {
    id: 1,
    createdAt: new Date("2024-03-04T21:00:00"),
    applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
    student: {
      id: 1,
      name: "이지윤",
      studentNumber: 20200510,
      email: "nicolelee2001@kaist.ac.kr",
      phoneNumber: "XXX-XXXX-XXXX",
    },
  },
  {
    id: 1,
    createdAt: new Date("2024-03-04T21:00:00"),
    applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
    student: {
      id: 1,
      name: "박지호",
      studentNumber: 20200510,
      email: "nicolelee2001@kaist.ac.kr",
      phoneNumber: "XXX-XXXX-XXXX",
    },
  },
  {
    id: 3,
    createdAt: new Date("2024-03-04T21:00:00"),
    applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
    student: {
      id: 1,
      name: "박병찬",
      studentNumber: 20200510,
      email: "nicolelee2001@kaist.ac.kr",
      phoneNumber: "XXX-XXXX-XXXX",
    },
  },
  {
    id: 4,
    createdAt: new Date("2024-03-04T21:00:00"),
    applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Approved,
    student: {
      id: 1,
      name: "이도라",
      studentNumber: 20200510,
      email: "nicolelee2001@kaist.ac.kr",
      phoneNumber: "XXX-XXXX-XXXX",
    },
  },
  {
    id: 5,
    createdAt: new Date("2024-03-04T21:00:00"),
    applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Rejected,
    student: {
      id: 1,
      name: "이지윤",
      studentNumber: 20200510,
      email: "nicolelee2001@kaist.ac.kr",
      phoneNumber: "XXX-XXXX-XXXX",
    },
  },
];

const mockupManageFunding: NewFundingData[] = [
  {
    id: 1,
    fundingStatusEnum: FundingStatusEnum.Applied,
    name: "개발개발한 어떠한 활동",
    activityName: "모니터",
    expenditureAmount: 300000,
    approvedAmount: undefined,
  },
  {
    id: 2,
    fundingStatusEnum: FundingStatusEnum.Applied,
    name: "개발개발한 어떠한 활동",
    activityName: "모니터",
    expenditureAmount: 300000,
    approvedAmount: undefined,
  },
  {
    id: 3,
    fundingStatusEnum: FundingStatusEnum.Committee,
    name: "개발개발한 어떠한 활동",
    activityName: "모니터",
    expenditureAmount: 300000,
    approvedAmount: undefined,
  },
  {
    id: 4,
    fundingStatusEnum: FundingStatusEnum.Rejected,
    name: "개발개발한 어떠한 활동",
    activityName: "모니터",
    expenditureAmount: 300000,
    approvedAmount: 0,
  },
  {
    id: 5,
    fundingStatusEnum: FundingStatusEnum.Approved,
    name: "개발개발한 어떠한 활동",
    activityName: "모니터",
    expenditureAmount: 300000,
    approvedAmount: 300000,
  },
  {
    id: 6,
    fundingStatusEnum: FundingStatusEnum.Approved,
    name: "개발개발한 어떠한 활동",
    activityName: "모니터",
    expenditureAmount: 300000,
    approvedAmount: 100000,
  },
  {
    id: 6,
    fundingStatusEnum: FundingStatusEnum.Partial,
    name: "개발개발한 어떠한 활동",
    activityName: "모니터",
    expenditureAmount: 300000,
    approvedAmount: 100000,
  },
];

const mockupPastManageFunding: Funding[] = [
  {
    id: 1,
    status: 1,
    name: "개발개발한 어떠한 활동",
    itemName: "모니터",
    requestedAmount: 300000,
    approvedAmount: null,
  },
  {
    id: 2,
    status: 1,
    name: "개발개발한 어떠한 활동",
    itemName: "모니터",
    requestedAmount: 300000,
    approvedAmount: null,
  },
  {
    id: 3,
    status: 2,
    name: "개발개발한 어떠한 활동",
    itemName: "모니터",
    requestedAmount: 300000,
    approvedAmount: null,
  },
  {
    id: 4,
    status: 4,
    name: "개발개발한 어떠한 활동",
    itemName: "모니터",
    requestedAmount: 300000,
    approvedAmount: null,
  },
  {
    id: 5,
    status: 3,
    name: "개발개발한 어떠한 활동",
    itemName: "모니터",
    requestedAmount: 300000,
    approvedAmount: 300000,
  },
  {
    id: 6,
    status: 3,
    name: "개발개발한 어떠한 활동",
    itemName: "모니터",
    requestedAmount: 300000,
    approvedAmount: 0,
  },
];

const mockupManageReport: Activity[] = [
  {
    id: 1,
    status: 1,
    professorApproval: ActivityProfessorApprovalEnum.Requested,
    name: "개발개발한 어떠한 활동",
    type: 1,
    startDate: new Date("2024-03-11"),
    endTerm: new Date("2024-03-18"),
  },
  {
    id: 2,
    status: 2,
    professorApproval: ActivityProfessorApprovalEnum.Requested,
    name: "개발개발한 어떠한 활동",
    type: 1,
    startDate: new Date("2024-03-11"),
    endTerm: new Date("2024-03-18"),
  },
  {
    id: 3,
    status: 2,
    professorApproval: ActivityProfessorApprovalEnum.Approved,
    name: "개발개발한 어떠한 활동",
    type: 2,
    startDate: new Date("2024-03-11"),
    endTerm: new Date("2024-03-18"),
  },
  {
    id: 4,
    status: 4,
    professorApproval: ActivityProfessorApprovalEnum.Denied,
    name: "개발개발한 어떠한 활동",
    type: 2,
    startDate: new Date("2024-03-11"),
    endTerm: new Date("2024-03-18"),
  },
  {
    id: 5,
    status: 3,
    professorApproval: ActivityProfessorApprovalEnum.Approved,
    name: "개발개발한 어떠한 활동",
    type: 1,
    startDate: new Date("2024-03-11"),
    endTerm: new Date("2024-03-18"),
  },
  {
    id: 6,
    status: 3,
    professorApproval: ActivityProfessorApprovalEnum.Approved,
    name: "2024년도 봄학기 MT",
    type: 3,
    startDate: new Date("2024-03-11"),
    endTerm: new Date("2024-03-18"),
  },
];

const mockupManageRental: ApiRnt003ResponseOK = {
  items: [
    {
      id: 1,
      studentName: "이지윤",
      objects: [
        {
          id: 1,
          name: "돗자리",
          number: 3,
        },
        {
          id: 2,
          name: "드릴",
          number: 1,
        },
        {
          id: 3,
          name: "어쩌구",
          number: 1,
        },
      ],
      statusEnum: RentalOrderStatusEnum.Applied,
      desiredStart: new Date(),
      desiredEnd: new Date(),
      startDate: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      id: 2,
      studentName: "이지윤",
      objects: [
        {
          id: 1,
          name: "돗자리",
          number: 3,
        },
        {
          id: 2,
          name: "드릴",
          number: 1,
        },
        {
          id: 3,
          name: "어쩌구",
          number: 1,
        },
      ],
      statusEnum: RentalOrderStatusEnum.Approved,
      desiredStart: new Date(),
      desiredEnd: new Date(),
      startDate: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      id: 3,
      studentName: "이지윤",
      objects: [
        {
          id: 1,
          name: "돗자리",
          number: 3,
        },
        {
          id: 2,
          name: "드릴",
          number: 1,
        },
        {
          id: 3,
          name: "어쩌구",
          number: 1,
        },
      ],
      statusEnum: RentalOrderStatusEnum.Rented,
      desiredStart: new Date(),
      desiredEnd: new Date(),
      startDate: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      id: 4,
      studentName: "이지윤",
      objects: [
        {
          id: 1,
          name: "돗자리",
          number: 3,
        },
        {
          id: 2,
          name: "드릴",
          number: 1,
        },
        {
          id: 3,
          name: "어쩌구",
          number: 1,
        },
      ],
      statusEnum: RentalOrderStatusEnum.Returned,
      desiredStart: new Date(),
      desiredEnd: new Date(),
      startDate: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
  ],
  total: 4,
  offset: 4,
};

const mockupManagePrint: ApiPrt001ResponseOk = {
  items: [
    {
      id: 1,
      studentName: "이지윤",
      status: PromotionalPrintingOrderStatusEnum.Applied,
      orders: [
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A4,
          numberOfPrints: 50,
        },
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A3,
          numberOfPrints: 20,
        },
      ],
      desiredPickUpDate: new Date(),
      createdAt: new Date(),
    },
    {
      id: 2,
      studentName: "이지윤",
      status: PromotionalPrintingOrderStatusEnum.Approved,
      orders: [
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A4,
          numberOfPrints: 50,
        },
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A3,
          numberOfPrints: 20,
        },
      ],
      desiredPickUpDate: new Date(),
      createdAt: new Date(),
    },
    {
      id: 3,
      studentName: "이지윤",
      status: PromotionalPrintingOrderStatusEnum.Printed,
      orders: [
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A4,
          numberOfPrints: 50,
        },
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A3,
          numberOfPrints: 20,
        },
      ],
      desiredPickUpDate: new Date(),
      createdAt: new Date(),
    },
    {
      id: 4,
      studentName: "이지윤",
      status: PromotionalPrintingOrderStatusEnum.Received,
      orders: [
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A4,
          numberOfPrints: 50,
        },
        {
          promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A3,
          numberOfPrints: 20,
        },
      ],
      desiredPickUpDate: new Date(),
      createdAt: new Date(),
    },
  ],
  total: 4,
  offset: 1,
};

const mockupManageAcf: ApiAcf003ResponseOk = {
  items: [
    {
      orderId: 1,
      studentName: "이지윤",
      issuedNumber: 2,
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(),
    },
    {
      orderId: 2,
      studentName: "이지윤",
      issuedNumber: 3,
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(),
    },
    {
      orderId: 3,
      studentName: "이지윤",
      issuedNumber: 2,
      statusEnum: ActivityCertificateOrderStatusEnum.Issued,
      createdAt: new Date(),
    },
    {
      orderId: 4,
      studentName: "이지윤",
      issuedNumber: 3,
      statusEnum: ActivityCertificateOrderStatusEnum.Rejected,
      createdAt: new Date(),
    },
  ],
  total: 4,
  offset: 1,
};

const mockupManageCms: ApiCms006ResponseOk = {
  items: [
    {
      orderId: 1,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Applied,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "이지윤",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      orderId: 2,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Applied,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "이지윤",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      orderId: 3,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Canceled,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "이지윤",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      orderId: 4,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Used,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "이지윤",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
  ],
  total: 4,
  offset: 1,
};

export {
  mockClubDescription,
  mockClubMembers,
  mockupManageAcf,
  mockupManageCms,
  mockupManageFunding,
  mockupManageMems,
  mockupManagePrint,
  mockupManageRental,
  mockupManageReport,
  mockupPastManageFunding,
};
