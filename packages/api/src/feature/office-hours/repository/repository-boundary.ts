export const repositoryBoundary = {
  ownedPrismaModels: ["officeHour"],
  exportedPrismaModels: ["officeHour"],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["executive"],
    },
    {
      from: "packages/api/src/feature/rental/repository/repository-boundary.ts",
      models: ["rentalReservation", "rentalExtension"],
    },
  ],
} as const;
