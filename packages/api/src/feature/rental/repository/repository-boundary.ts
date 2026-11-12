export const repositoryBoundary = {
  ownedPrismaModels: [
    "rentalObject",
    "rentalOrder",
    "rentalOrderItemD",
    "rentalItem",
    "rentalReservation",
    "rentalExtension",
  ],
  exportedPrismaModels: ["rentalOrder", "rentalReservation", "rentalExtension"],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/office-hours/repository/repository-boundary.ts",
      models: ["officeHour"],
    },
    {
      from: "packages/api/src/feature/club/repository/repository-boundary.ts",
      models: ["club"],
    },
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["student", "executive", "user"],
    },
  ],
} as const;
