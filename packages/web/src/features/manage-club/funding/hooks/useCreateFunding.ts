import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isParticipantsRequired } from "@sparcs-clubs/web/utils/isTransportation";

import { newFundingListQueryKey } from "../services/useGetNewFundingList";
import usePostFunding from "../services/usePostFunding";
import {
  FundingFormData,
  isActivityReportUnverifiable,
} from "../types/funding";

export const useCreateFunding = (clubId: number) => {
  const queryClient = useQueryClient();
  const { mutateAsync: createFunding } = usePostFunding();

  return useMutation({
    mutationFn: ({
      purposeActivity,
      name,
      expenditureAmount,
      tradeDetailExplanation,
      isFixture,
      isTransportation,
      isNonCorporateTransaction,
      isFoodExpense,
      isLaborContract,
      isExternalEventParticipationFee,
      isPublication,
      isProfitMakingActivity,
      isJointExpense,
      isEtcExpense,
      ...data
    }: FundingFormData) =>
      createFunding(
        {
          body: {
            club: {
              id: clubId,
            },
            purposeActivity: purposeActivity
              ? { id: purposeActivity.id }
              : { id: null },
            name,
            expenditureDate: data.expenditureDate,
            expenditureAmount: Number(expenditureAmount),

            tradeEvidenceFiles: data.tradeEvidenceFiles.map(file => ({
              id: file.id,
            })),
            tradeDetailFiles: data.tradeDetailFiles.map(file => ({
              id: file.id,
            })),
            tradeDetailExplanation,

            isFixture,
            isTransportation,
            isNonCorporateTransaction,
            isFoodExpense,
            isLaborContract,
            isExternalEventParticipationFee,
            isPublication,
            isProfitMakingActivity,
            isJointExpense,
            isEtcExpense,

            clubSupplies: isActivityReportUnverifiable(purposeActivity?.id)
              ? {
                  name: data.clubSuppliesName,
                  evidenceEnum: data.clubSuppliesEvidenceEnum,
                  classEnum: data.clubSuppliesClassEnum,
                  purpose: data.clubSuppliesPurpose,
                  imageFiles: data.clubSuppliesImageFiles
                    ? data.clubSuppliesImageFiles.map(file => ({
                        id: file.id,
                      }))
                    : [],
                  softwareEvidence: data.clubSuppliesSoftwareEvidence,
                  softwareEvidenceFiles: data.clubSuppliesSoftwareEvidenceFiles
                    ? data.clubSuppliesSoftwareEvidenceFiles.map(file => ({
                        id: file.id,
                      }))
                    : [],
                  number: Number(data.numberOfClubSupplies),
                  price: Number(data.priceOfClubSupplies),
                }
              : undefined,

            fixture: isFixture
              ? {
                  name: data.fixtureName,
                  evidenceEnum: data.fixtureEvidenceEnum,
                  classEnum: data.fixtureClassEnum,
                  purpose: data.fixturePurpose,
                  imageFiles: data.fixtureImageFiles
                    ? data.fixtureImageFiles.map(file => ({
                        id: file.id,
                      }))
                    : [],
                  softwareEvidence: data.fixtureSoftwareEvidence,
                  softwareEvidenceFiles: data.fixtureSoftwareEvidenceFiles
                    ? data.fixtureSoftwareEvidenceFiles.map(file => ({
                        id: file.id,
                      }))
                    : [],
                  number: data.numberOfFixture,
                  price: data.priceOfFixture,
                }
              : undefined,

            transportation: isTransportation
              ? {
                  enum: data.transportationEnum,
                  origin: data.origin,
                  destination: data.destination,
                  purpose: data.purposeOfTransportation,
                  passengers: isParticipantsRequired(data.transportationEnum)
                    ? data.transportationPassengers.map(participant => ({
                        id: participant.id,
                      }))
                    : [],
                }
              : undefined,

            nonCorporateTransaction: isNonCorporateTransaction
              ? {
                  traderName: data.traderName,
                  traderAccountNumber: data.traderAccountNumber,
                  wasteExplanation: data.wasteExplanation,
                  files: data.nonCorporateTransactionFiles
                    ? data.nonCorporateTransactionFiles.map(file => ({
                        id: file.id,
                      }))
                    : [],
                }
              : undefined,

            foodExpense: isFoodExpense
              ? {
                  explanation: data.foodExpenseExplanation,
                  files: data.foodExpenseFiles.map(file => ({
                    id: file.id,
                  })),
                }
              : undefined,

            laborContract: isLaborContract
              ? {
                  explanation: data.laborContractExplanation,
                  files: data.laborContractFiles.map(file => ({
                    id: file.id,
                  })),
                }
              : undefined,

            externalEventParticipationFee: isExternalEventParticipationFee
              ? {
                  explanation: data.externalEventParticipationFeeExplanation,
                  files: data.externalEventParticipationFeeFiles.map(file => ({
                    id: file.id,
                  })),
                }
              : undefined,

            publication: isPublication
              ? {
                  explanation: data.publicationExplanation,
                  files: data.publicationFiles.map(file => ({
                    id: file.id,
                  })),
                }
              : undefined,

            profitMakingActivity: isProfitMakingActivity
              ? {
                  explanation: data.profitMakingActivityExplanation,
                  files: data.profitMakingActivityFiles.map(file => ({
                    id: file.id,
                  })),
                }
              : undefined,

            jointExpense: isJointExpense
              ? {
                  explanation: data.jointExpenseExplanation,
                  files: data.jointExpenseFiles.map(file => ({
                    id: file.id,
                  })),
                }
              : undefined,

            etcExpense: isEtcExpense
              ? {
                  explanation: data.etcExpenseExplanation,
                  files: data.etcExpenseFiles.map(file => ({
                    id: file.id,
                  })),
                }
              : undefined,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: newFundingListQueryKey(clubId),
            });
          },
        },
      ),
  });
};
