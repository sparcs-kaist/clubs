export const repositoryBoundary = {
  ownedPrismaModels: [
    "registration",
    "registrationApplicationStudent",
    "registrationApplicationStudentStatusEnum",
    "registrationExecutiveComment",
    "registrationStatusEnum",
    "registrationTypeEnum",
  ],
  exportedPrismaModels: [
    "registration",
    "registrationApplicationStudent",
    "registrationExecutiveComment",
  ],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/club/repository/repository-boundary.ts",
      models: ["club"],
    },
    {
      from: "packages/api/src/feature/division/repository/repository-boundary.ts",
      models: ["division"],
    },
    {
      from: "packages/api/src/feature/semester/repository/repository-boundary.ts",
      models: ["semesterD"],
    },
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["executive", "professor", "student"],
    },
  ],
} as const;
