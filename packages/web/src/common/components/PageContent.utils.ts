export type ProductionReadyPathList = {
  exact: string[];
  startsWith: string[];
  exclude: string[];
};

export const isProductionReadyPath = (
  path: string,
  productionReadyPaths: ProductionReadyPathList,
) =>
  (productionReadyPaths.exact.includes(path) ||
    productionReadyPaths.startsWith.some(prefix => path.startsWith(prefix))) &&
  !productionReadyPaths.exclude.includes(path);
