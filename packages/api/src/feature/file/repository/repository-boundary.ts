export const repositoryBoundary = {
  ownedPrismaModels: ["file"],
  exportedPrismaModels: ["file"],
  importedPrismaModels: [
    {
      from: "packages/api/src/feature/user/repository/repository-boundary.ts",
      models: ["user"],
    },
  ],
} as const;
