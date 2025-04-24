import { ApiFnd002ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd002";
import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";
import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
  FundingStatusEnum,
  TransportationEnum,
} from "@clubs/interface/common/enum/funding.enum";

const mockFundingDetail: ApiFnd002ResponseOk = {
  funding: {
    id: 1,
    club: {
      id: 1,
    },
    activityD: {
      id: 1,
    },
    purposeActivity: {
      id: 1,
      name: "2021년 1학기 해커톤",
      activityStatusEnum: ActivityStatusEnum.Approved,
      activityTypeEnum: ActivityTypeEnum.matchedExternalActivity,
      club: { id: 112 },
      commentedAt: new Date(),
      editedAt: new Date(),
      updatedAt: new Date(),
    },
    name: "M1 맥북 Pro 16 inch",
    expenditureDate: new Date(),
    expenditureAmount: 2500000,
    fundingStatusEnum: FundingStatusEnum.Applied,
    tradeEvidenceFiles: [
      {
        id: "trade1",
        name: "trade1",
        url: "https://via.placeholder.com/150",
      },
    ],
    tradeDetailFiles: [
      {
        id: "detail1",
        name: "detail1",
        url: "https://via.placeholder.com/150",
      },
    ],
    tradeDetailExplanation: "이벤트를 위한 거래에 대한 세부 정보입니다.",

    isFixture: true,
    fixture: {
      name: "A4 종이",
      evidenceEnum: FixtureEvidenceEnum.Management,
      classEnum: FixtureClassEnum.Others,
      purpose: "비품 사용 목적을 포함한 어떠한 머시꺵이",
      imageFiles: [
        {
          id: "fixture1",
          name: "A4 종이",
          url: "https://via.placeholder.com/150",
        },
      ],
      softwareEvidenceFiles: [],
      number: 2,
      price: 300,
    },

    isTransportation: true,
    transportation: {
      enum: TransportationEnum.Airplane,
      origin: "서울역",
      destination: "대전역",
      purpose: "해커톤 장소 사전답사",
      passengers: [
        { id: 1, studentNumber: "20240510", name: "스팍스" },
        { id: 2, studentNumber: "20200515", name: "이도라" },
      ],
    },

    isNonCorporateTransaction: true,
    nonCorporateTransaction: {
      traderName: "이도라",
      traderAccountNumber: "123456789",
      wasteExplanation: "낭비아님소명",
      files: [
        {
          id: "noncorp1",
          name: "noncorp1",
          url: "https://via.placeholder.com/150",
        },
      ],
    },

    isFoodExpense: true,
    foodExpense: {
      explanation: "어떠한 설명",
      files: [
        { id: "food1", name: "food1", url: "https://via.placeholder.com/150" },
      ],
    },

    isLaborContract: true,
    laborContract: {
      explanation: "어떠한 설명",
      files: [
        {
          id: "labor1",
          name: "labor1",
          url: "https://via.placeholder.com/150",
        },
      ],
    },

    isExternalEventParticipationFee: true,
    externalEventParticipationFee: {
      explanation: "어떠한 설명",
      files: [
        {
          id: "event1",
          name: "event1",
          url: "https://via.placeholder.com/150",
        },
      ],
    },

    isPublication: true,
    publication: {
      explanation: "어떠한 설명",
      files: [
        { id: "pub1", name: "pub1", url: "https://via.placeholder.com/150" },
      ],
    },

    isProfitMakingActivity: true,
    profitMakingActivity: {
      explanation: "어떠한 설명",
      files: [
        {
          id: "profit1",
          name: "profit1",
          url: "https://via.placeholder.com/150",
        },
      ],
    },

    isJointExpense: true,
    jointExpense: {
      explanation: "어떠한 설명",
      files: [
        {
          id: "joint1",
          name: "joint1",
          url: "https://via.placeholder.com/150",
        },
      ],
    },

    isEtcExpense: true,
    etcExpense: {
      explanation: "어떠한 설명",
      files: [
        { id: "etc1", name: "etc1", url: "https://via.placeholder.com/150" },
      ],
    },
    createdAt: new Date(),
    editedAt: new Date(),
  },
  comments: [],
};

export default mockFundingDetail;
