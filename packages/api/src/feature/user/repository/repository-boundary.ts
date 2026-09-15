export const repositoryBoundary = {
  ownedPrismaModels: [
    "employee",
    "employeeT",
    "executive",
    "executiveBureauEnum",
    "executiveStatusEnum",
    "executiveT",
    "professor",
    "professorT",
    "student",
    "studentT",
    "user",
    "userPrivacyPolicyAgreement",
  ],
  exportedPrismaModels: ["executive", "professor", "student", "user"],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/activity-certificate/repository/repository-boundary.ts",
      models: ["activityCertificate"],
    },
    {
      from: "packages/api/src/feature/club/repository/repository-boundary.ts",
      models: [
        "clubDelegateChangeRequest",
        "clubDelegateD",
        "clubStudentT",
        "clubT",
      ],
    },
    {
      from: "packages/api/src/feature/common-space/repository/repository-boundary.ts",
      models: ["commonSpaceUsageOrderD"],
    },
    {
      from: "packages/api/src/feature/division/repository/repository-boundary.ts",
      models: ["divisionPresidentD"],
    },
    {
      from: "packages/api/src/feature/file/repository/repository-boundary.ts",
      models: ["file"],
    },
    {
      from: "packages/api/src/feature/funding/repository/repository-boundary.ts",
      models: ["funding", "fundingFeedback", "fundingTransportationPassenger"],
    },
    {
      from: "packages/api/src/feature/meeting/repository/repository-boundary.ts",
      models: ["meetingAttendanceTimeT", "meetingVoteResult"],
    },
    {
      from: "packages/api/src/feature/promotional-printing/repository/repository-boundary.ts",
      models: ["promotionalPrintingOrder"],
    },
    {
      from: "packages/api/src/feature/registration/repository/repository-boundary.ts",
      models: [
        "registration",
        "registrationApplicationStudent",
        "registrationExecutiveComment",
      ],
    },
    {
      from: "packages/api/src/feature/rental/repository/repository-boundary.ts",
      models: ["rentalOrder"],
    },
  ],
} as const;
