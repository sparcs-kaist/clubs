import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import { useGetFunding } from "../services/useGetFunding";
import { FundingFormData } from "../types/funding";

const useGetInitialFundingFormData = (
  fundingId: number,
): {
  data: FundingFormData;
  isLoading: boolean;
  isError: boolean;
} => {
  const { profile } = useAuth();
  const { data, isLoading, isError } = useGetFunding(
    UserTypeEnum.Undergraduate,
    fundingId,
  );

  if (profile?.type !== UserTypeEnum.Undergraduate) {
    return {
      data: {} as FundingFormData,
      isLoading: false,
      isError: true,
    };
  }

  if (isLoading || isError || !data?.funding) {
    return {
      data: {} as FundingFormData,
      isLoading,
      isError,
    };
  }

  return {
    data: {
      ...data?.funding,
      // 동아리 용품 증빙
      clubSuppliesName: data?.funding.clubSupplies?.name,
      clubSuppliesEvidenceEnum: data?.funding.clubSupplies?.evidenceEnum,
      clubSuppliesClassEnum: data?.funding.clubSupplies?.classEnum,
      clubSuppliesPurpose: data?.funding.clubSupplies?.purpose,
      clubSuppliesImageFiles: data?.funding.clubSupplies?.imageFiles ?? [],
      clubSuppliesSoftwareEvidence:
        data?.funding.clubSupplies?.softwareEvidence,
      clubSuppliesSoftwareEvidenceFiles:
        data?.funding.clubSupplies?.softwareEvidenceFiles ?? [],
      numberOfClubSupplies: data?.funding.clubSupplies?.number,
      priceOfClubSupplies: data?.funding.clubSupplies?.price,

      // 비품 증빙
      fixtureName: data?.funding.fixture?.name,
      fixtureEvidenceEnum: data?.funding.fixture?.evidenceEnum,
      fixtureClassEnum: data?.funding.fixture?.classEnum,
      fixturePurpose: data?.funding.fixture?.purpose,
      fixtureImageFiles: data?.funding.fixture?.imageFiles ?? [],
      fixtureSoftwareEvidence: data?.funding.fixture?.softwareEvidence,
      fixtureSoftwareEvidenceFiles:
        data?.funding.fixture?.softwareEvidenceFiles ?? [],
      numberOfFixture: data?.funding.fixture?.number,
      priceOfFixture: data?.funding.fixture?.price,

      // 교통비 증빙
      transportationEnum: data?.funding.transportation?.enum,
      origin: data?.funding.transportation?.origin,
      destination: data?.funding.transportation?.destination,
      purposeOfTransportation: data?.funding.transportation?.purpose,
      transportationPassengers: data?.funding.transportation?.passengers ?? [],

      // 비법인 거래 증빙
      traderName: data?.funding.nonCorporateTransaction?.traderName,
      traderAccountNumber:
        data?.funding.nonCorporateTransaction?.traderAccountNumber,
      wasteExplanation: data?.funding.nonCorporateTransaction?.wasteExplanation,
      nonCorporateTransactionFiles:
        data?.funding.nonCorporateTransaction?.files ?? [],

      // 식비, 근로 계약, 외부 행사 참가비, 발간물, 수익 사업, 공동 경비, 기타 증빙
      foodExpenseExplanation: data?.funding.foodExpense?.explanation,
      laborContractExplanation: data?.funding.laborContract?.explanation,
      externalEventParticipationFeeExplanation:
        data?.funding.externalEventParticipationFee?.explanation,
      publicationExplanation: data?.funding.publication?.explanation,
      profitMakingActivityExplanation:
        data?.funding.profitMakingActivity?.explanation,
      jointExpenseExplanation: data?.funding.jointExpense?.explanation,
      etcExpenseExplanation: data?.funding.etcExpense?.explanation,

      foodExpenseFiles: data?.funding.foodExpense?.files ?? [],
      laborContractFiles: data?.funding.laborContract?.files ?? [],
      externalEventParticipationFeeFiles:
        data?.funding.externalEventParticipationFee?.files ?? [],
      publicationFiles: data?.funding.publication?.files ?? [],
      profitMakingActivityFiles:
        data?.funding.profitMakingActivity?.files ?? [],
      jointExpenseFiles: data?.funding.jointExpense?.files ?? [],
      etcExpenseFiles: data?.funding.etcExpense?.files ?? [],
    },
    isLoading,
    isError,
  };
};

export default useGetInitialFundingFormData;
