export const repositoryBoundary = {
  ownedPrismaModels: [
    "meeting",
    "meetingAgenda",
    "meetingAgendaContent",
    "meetingAgendaVote",
    "meetingAnnouncement",
    "meetingAttendanceDay",
    "meetingAttendanceTimeT",
    "meetingMapping",
    "meetingRoleEnum",
    "meetingVoteChoice",
    "meetingVoteResult",
  ],
  exportedPrismaModels: [
    "meetingAttendanceDay",
    "meetingAttendanceTimeT",
    "meetingVoteResult",
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
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["user"],
    },
  ],
} as const;
