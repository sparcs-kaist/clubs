import { useQuery } from "@tanstack/react-query";

import { ApiFnd002ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd002";
import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";

import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

import { fundingDetailGet } from "./_atomic/fndApiList";

export const fundingDetailQueryKey = (profile: string, fundingId: number) => [
  fundingDetailGet(profile, fundingId),
];

export const useGetFunding = (
  profile: string,
  fundingId: number,
  operatingCommitteeSecret?: string,
) =>
  useQuery<ApiFnd002ResponseOk, Error>({
    queryKey: [
      ...fundingDetailQueryKey(profile, fundingId),
      operatingCommitteeSecret,
    ],
    queryFn: async (): Promise<ApiFnd002ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        fundingDetailGet(profile, fundingId),
        { params: { operatingCommitteeSecret } },
      );

      return data;
    },
  });

defineAxiosMock(mock => {
  const fundingStatus = FundingStatusEnum.Approved;
  const mockFundingDetail = {
    id: 1,
    club: {
      id: 112,
    },
    activityD: {
      id: 5,
    },
    fundingStatusEnum: fundingStatus,
    purposeActivity: {
      id: 3335,
      activityStatusEnum: 2,
      activityTypeEnum: 1,
      club: {
        id: 112,
        name: "술박스",
      },
      name: "ffsgdgfd",
      commentedAt: null,
      editedAt: "2025-01-22T23:07:21.000Z",
      updatedAt: "2025-01-25T04:35:48.000Z",
    },
    name: "ㅁㄹㅁㄴㅇㄹㅁㄴㅇㄹ",
    expenditureDate: "2024-08-07T09:00:00.000Z",
    expenditureAmount: 234234,
    approvedAmount: 0,
    tradeEvidenceFiles: [
      {
        id: "b5884fb8-672d-45cf-a4de-5d1ce34a35f4",
        name: "websiteplanet-dummy-540X400.png",
        extension: "png",
        size: 8141,
        userId: 8608,
        url: "https://ar-002-clubs-v2-dev.s3.ap-northeast-2.amazonaws.com/file/8608.1737884920000.websiteplanet-dummy-540X400.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAZWM3SVKMLN74ARWD%2F20250130%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20250130T133654Z&X-Amz-Expires=600&X-Amz-Signature=210bbac945b25b631498baca8ac0efa1df5cf06768c9287aa4f1d79a04541e9a&X-Amz-SignedHeaders=host&x-id=GetObject",
      },
    ],
    tradeDetailFiles: [
      {
        id: "c0c3fe89-66bd-441f-89e1-069ec53cdfbc",
        name: "websiteplanet-dummy-540X400 (1).png",
        extension: "png",
        size: 8110,
        userId: 8608,
        url: "https://ar-002-clubs-v2-dev.s3.ap-northeast-2.amazonaws.com/file/8608.1737884926000.websiteplanet-dummy-540X400%20%281%29.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAZWM3SVKMLN74ARWD%2F20250130%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20250130T133654Z&X-Amz-Expires=600&X-Amz-Signature=2cb8499190a6de332edc28793c08f7702e84a596ba033a0bbf1044eab8ffc2e8&X-Amz-SignedHeaders=host&x-id=GetObject",
      },
    ],
    tradeDetailExplanation: "ㅇㅎㅇㅎㄹㅇㅎ",
    isFixture: false,
    isTransportation: false,
    isNonCorporateTransaction: false,
    isFoodExpense: false,
    isLaborContract: true,
    laborContract: {
      explanation: "ㅇㄴㄹㅇ",
      files: [
        {
          id: "4c991eb5-a5d9-4df9-a5cc-9dbf87d1c67a",
          name: "websiteplanet-dummy-540X400 (1).png",
          extension: "png",
          size: 8110,
          userId: 8608,
          url: "https://ar-002-clubs-v2-dev.s3.ap-northeast-2.amazonaws.com/file/8608.1737884935000.websiteplanet-dummy-540X400%20%281%29.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAZWM3SVKMLN74ARWD%2F20250130%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20250130T133654Z&X-Amz-Expires=600&X-Amz-Signature=0d291445afba29cc48a30136ca4d9b52ee89a4f4102df8418e4a6002e95ad7c4&X-Amz-SignedHeaders=host&x-id=GetObject",
        },
      ],
    },
    isExternalEventParticipationFee: false,
    isPublication: false,
    isProfitMakingActivity: false,
    isJointExpense: false,
    isEtcExpense: false,
    editedAt: "2025-01-26T18:48:59.000Z",
    commentedAt: new Date(),
    createdAt: "2025-01-26T18:48:59.000Z",
    updatedAt: "2025-01-29T22:41:08.000Z",
    comments: [
      {
        id: 1,
        funding: { id: 1 },
        chargedExecutive: { id: 123 },
        content: "대충 어떤 반려 사유",
        fundingStatusEnum: FundingStatusEnum.Rejected,
        approvedAmount: 1230,
        createdAt: new Date(2024, 11, 10),
      },
      {
        id: 1,
        funding: { id: 1 },
        chargedExecutive: { id: 123 },
        content: "대충 어떤 부분 승인 사유",
        fundingStatusEnum: FundingStatusEnum.Partial,
        approvedAmount: 1230,
        createdAt: new Date(2024, 12, 20),
      },
      {
        id: 1,
        funding: { id: 1 },
        chargedExecutive: { id: 123 },
        content: "대충 어떤 승인 사유",
        fundingStatusEnum: FundingStatusEnum.Approved,
        approvedAmount: 1230,
        createdAt: new Date(),
      },
    ],
  };

  const baseUrl = `/student/fundings/funding/`;
  mock
    .onGet(new RegExp(`^${baseUrl}\\d+$`))
    .reply(() => [200, mockFundingDetail]);
});
