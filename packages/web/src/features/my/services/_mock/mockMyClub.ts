import type { ApiAcf003ResponseOk } from "@sparcs-clubs/interface/api/activity-certificate/endpoint/apiAcf003";
import type { ApiCms006ResponseOk } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms006";
import type { ApiPrt001ResponseOk } from "@sparcs-clubs/interface/api/promotional-printing/endpoint/apiPrt001";
import type { ApiRnt003ResponseOK } from "@sparcs-clubs/interface/api/rental/endpoint/apiRnt003";
import { ActivityCertificateOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/activityCertificate.enum";
import { CommonSpaceUsageOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/commonSpace.enum";
import {
  PromotionalPrintingOrderStatusEnum,
  PromotionalPrintingSizeEnum,
} from "@sparcs-clubs/interface/common/enum/promotionalPrinting.enum";
import { RentalOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/rental.enum";

// TODO: studentName -> clubName
const mockupMyRental: ApiRnt003ResponseOK = {
  items: [
    {
      id: 1,
      studentName: "술박스",
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
      studentName: "술박스",
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
      studentName: "술박스",
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
      studentName: "술박스",
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

const mockupMyPrint: ApiPrt001ResponseOk = {
  items: [
    {
      id: 1,
      studentName: "술박스",
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
      studentName: "술박스",
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
      studentName: "술박스",
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
      studentName: "술박스",
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

const mockupMyAcf: ApiAcf003ResponseOk = {
  items: [
    {
      orderId: 1,
      studentName: "술박스",
      issuedNumber: 2,
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(),
    },
    {
      orderId: 2,
      studentName: "술박스",
      issuedNumber: 3,
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(),
    },
    {
      orderId: 3,
      studentName: "술박스",
      issuedNumber: 2,
      statusEnum: ActivityCertificateOrderStatusEnum.Issued,
      createdAt: new Date(),
    },
    {
      orderId: 4,
      studentName: "술박스",
      issuedNumber: 3,
      statusEnum: ActivityCertificateOrderStatusEnum.Rejected,
      createdAt: new Date(),
    },
  ],
  total: 4,
  offset: 1,
};

const mockupMyCms: ApiCms006ResponseOk = {
  items: [
    {
      orderId: 1,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Applied,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "술박스",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      orderId: 2,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Applied,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "술박스",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      orderId: 3,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Canceled,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "술박스",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
    {
      orderId: 4,
      statusEnum: CommonSpaceUsageOrderStatusEnum.Used,
      spaceName: "제1공용동아리방 (태울관 2101호)",
      chargeStudentName: "술박스",
      startTerm: new Date(),
      endTerm: new Date(),
      createdAt: new Date(),
    },
  ],
  total: 4,
  offset: 1,
};

export { mockupMyAcf, mockupMyRental, mockupMyPrint, mockupMyCms };
