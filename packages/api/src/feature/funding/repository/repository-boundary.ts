export const repositoryBoundary = {
  ownedPrismaModels: [
    "funding",
    "fundingChangeHistory",
    "fundingClubSuppliesImageFile",
    "fundingClubSuppliesSoftwareEvidenceFile",
    "fundingEtcExpenseFile",
    "fundingExternalEventParticipationFeeFile",
    "fundingFeedback",
    "fundingFixtureImageFile",
    "fundingFixtureSoftwareEvidenceFile",
    "fundingFoodExpenseFile",
    "fundingJointExpenseFile",
    "fundingLaborContractFile",
    "fundingNonCorporateTransactionFile",
    "fundingProfitMakingActivityFile",
    "fundingPublicationFile",
    "fundingTradeDetailFile",
    "fundingTradeEvidenceFile",
    "fundingTransportationPassenger",
    "fundingInternalMemo",
  ],
  exportedPrismaModels: [
    "funding",
    "fundingFeedback",
    "fundingTransportationPassenger",
  ],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/club/repository-boundary.ts",
      models: ["club"],
    },
    {
      from: "packages/api/src/feature/semester/repository/repository-boundary.ts",
      models: ["activityD"],
    },
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["executive", "student"],
    },
  ],
} as const;
