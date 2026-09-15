export const repositoryBoundary = {
  ownedPrismaModels: [
    "rentalEnum",
    "rentalObject",
    "rentalOrder",
    "rentalOrderItemD",
  ],
  exportedPrismaModels: ["rentalOrder"],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/club/repository/repository-boundary.ts",
      models: ["club"],
    },
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["student"],
    },
  ],
} as const;
