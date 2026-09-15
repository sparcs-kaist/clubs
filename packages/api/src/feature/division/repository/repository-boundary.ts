export const repositoryBoundary = {
  ownedPrismaModels: [
    "district",
    "division",
    "divisionPermanentClubD",
    "divisionPresidentD",
  ],
  exportedPrismaModels: [
    "division",
    "divisionPermanentClubD",
    "divisionPresidentD",
  ],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/club/repository/repository-boundary.ts",
      models: ["club", "clubDivisionHistory"],
    },
    {
      from: "packages/api/src/feature/meeting/repository/repository-boundary.ts",
      models: ["meetingAttendanceDay"],
    },
    {
      from: "packages/api/src/feature/registration/repository/repository-boundary.ts",
      models: ["registration"],
    },
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["student"],
    },
  ],
} as const;
