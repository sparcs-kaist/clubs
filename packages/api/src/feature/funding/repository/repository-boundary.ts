export const repositoryBoundary = {
  ownedPrismaModels: [
    "funding",
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
  ],
  exportedPrismaModels: [
    "funding",
    "fundingFeedback",
    "fundingTransportationPassenger",
  ],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/club/repository/repository-boundary.ts",
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
