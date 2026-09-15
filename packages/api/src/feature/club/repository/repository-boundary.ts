export const repositoryBoundary = {
  ownedPrismaModels: [
    "club",
    "clubBuildingEnum",
    "clubDelegateChangeRequest",
    "clubDelegateChangeRequestStatusEnum",
    "clubDelegateD",
    "clubDivisionHistory",
    "clubRoomT",
    "clubStatusEnum",
    "clubStudentT",
    "clubT",
  ],
  exportedPrismaModels: [
    "club",
    "clubDelegateChangeRequest",
    "clubDelegateD",
    "clubDivisionHistory",
    "clubRoomT",
    "clubStudentT",
    "clubT",
  ],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/activity-certificate/repository/repository-boundary.ts",
      models: ["activityCertificate"],
    },
    {
      from: "packages/api/src/feature/common-space/repository/repository-boundary.ts",
      models: ["commonSpaceUsageOrderD"],
    },
    {
      from: "packages/api/src/feature/division/repository/repository-boundary.ts",
      models: ["division", "divisionPermanentClubD"],
    },
    {
      from: "packages/api/src/feature/funding/repository/repository-boundary.ts",
      models: ["funding"],
    },
    {
      from: "packages/api/src/feature/meeting/repository/repository-boundary.ts",
      models: ["meetingAttendanceDay"],
    },
    {
      from: "packages/api/src/feature/promotional-printing/repository/repository-boundary.ts",
      models: ["promotionalPrintingOrder"],
    },
    {
      from: "packages/api/src/feature/registration/repository/repository-boundary.ts",
      models: ["registration", "registrationApplicationStudent"],
    },
    {
      from: "packages/api/src/feature/rental/repository/repository-boundary.ts",
      models: ["rentalOrder"],
    },
    {
      from: "packages/api/src/feature/semester/repository/repository-boundary.ts",
      models: ["semesterD"],
    },
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["professor", "student"],
    },
  ],
} as const;
