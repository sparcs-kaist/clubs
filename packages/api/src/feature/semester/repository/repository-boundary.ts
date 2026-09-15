export const repositoryBoundary = {
  ownedPrismaModels: ["activityD", "registrationDeadlineD", "semesterD"],
  exportedPrismaModels: ["activityD", "semesterD"],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/club/repository/repository-boundary.ts",
      models: ["clubRoomT", "clubStudentT", "clubT"],
    },
    {
      from: "packages/api/src/feature/funding/repository/repository-boundary.ts",
      models: ["funding"],
    },
    {
      from: "packages/api/src/feature/registration/repository/repository-boundary.ts",
      models: ["registration", "registrationApplicationStudent"],
    },
  ],
} as const;
