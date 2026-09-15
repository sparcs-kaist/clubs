export const repositoryBoundary = {
  ownedPrismaModels: [
    "promotionalPrintingOrder",
    "promotionalPrintingOrderSize",
  ],
  exportedPrismaModels: ["promotionalPrintingOrder"],
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
