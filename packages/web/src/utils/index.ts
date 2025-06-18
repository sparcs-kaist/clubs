export const isObjectEmpty = <T extends object>(obj?: T): boolean =>
  obj == null || Object.keys(obj).length === 0;

export const objectDeepCompare = (current: object, previous: object) =>
  Object.entries(current).some(([key, value]) => {
    const previousValue = previous[key as keyof object];
    return JSON.stringify(value) !== JSON.stringify(previousValue);
  });
