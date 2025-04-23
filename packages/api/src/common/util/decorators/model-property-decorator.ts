import { EXCLUDE_IN_CREATE_KEY } from "@sparcs-clubs/api/common/meta-keys";

/**
 * @description 주어진 모델 중 Create 작업에서 제외할 필드를 지정하는 데코레이터
 */
export function ExcludeInCreate() {
  return (target: object, propertyKey: string) => {
    // 클래스에 ExcludeInCreate 필드 목록 저장
    const excludeInCreateFields =
      Reflect.getMetadata(EXCLUDE_IN_CREATE_KEY, target.constructor) || [];
    if (!excludeInCreateFields.includes(propertyKey)) {
      Reflect.defineMetadata(
        EXCLUDE_IN_CREATE_KEY,
        [...excludeInCreateFields, propertyKey],
        target.constructor,
      );
    }
  };
}

function getExcludeInCreateFields(target: object): string[] {
  const result = new Set<string>();
  let current = target;

  while (current && current !== Object.prototype) {
    const fields: string[] =
      Reflect.getMetadata(EXCLUDE_IN_CREATE_KEY, current) ?? [];
    fields.forEach(f => result.add(f));
    current = Object.getPrototypeOf(current);
  }

  return Array.from(result);
}

/**
 * @description 주어진 모델 중 Create 작업에서 제외된 필드를 제거하는 함수
 */
export function filterExcludedInCreateFields<T extends object>(entity: T): T {
  if (!entity) return entity;

  const excludeInCreateFields = getExcludeInCreateFields(entity.constructor);
  if (!excludeInCreateFields.length) return entity;

  const result = { ...entity };

  excludeInCreateFields.forEach(field => {
    delete (result as Record<string, unknown>)[field];
  });

  return result;
}
