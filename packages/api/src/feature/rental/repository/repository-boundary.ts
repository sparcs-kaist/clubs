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
      from: "packages/api/src/feature/club/repository-boundary.ts",
      models: ["club"],
    },
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["student"],
    },
  ],
} as const;
