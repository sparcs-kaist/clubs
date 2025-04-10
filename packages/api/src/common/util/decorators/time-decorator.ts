import { fromZonedTime, toZonedTime } from "date-fns-tz";

const DATE_FIELD_KEY = Symbol("date-field");
export const DB_TIMEZONE = "Asia/Seoul";

export function DateField() {
  return (target: object, propertyKey: string) => {
    // prop metadata 저장
    Reflect.defineMetadata(DATE_FIELD_KEY, {}, target, propertyKey);

    // 클래스에 Date 필드 목록 저장
    const dateFields =
      Reflect.getMetadata(DATE_FIELD_KEY, target.constructor) || [];
    if (!dateFields.includes(propertyKey)) {
      Reflect.defineMetadata(
        DATE_FIELD_KEY,
        [...dateFields, propertyKey],
        target.constructor,
      );
    }
  };
}

// class에서 모든 Date 프로퍼티 추출하는 함수
export function getDateFields(target: object): string[] {
  return Reflect.getMetadata(DATE_FIELD_KEY, target) || [];
}

// Date 필드 변환 유틸리티
export function adjustModelTimezoneFromDb<T>(entity: T): T {
  // Date Property들에 대해 KST DB -> UTC로 9시간 빼주는 함수
  if (!entity) return entity;

  const dateFields = getDateFields(entity.constructor);
  if (!dateFields.length) return entity;

  const result = { ...entity };

  dateFields
    .filter(field => result[field] instanceof Date)
    .forEach(field => {
      result[field] = fromZonedTime(result[field], DB_TIMEZONE);
    });

  return result;
}

export function adjustModelTimezoneToDb<T>(entity: T): T {
  // Date Property들에 대해 UTC -> KST DB로 9시간 더해주는 함수
  if (!entity) return entity;

  const dateFields = getDateFields(entity.constructor);
  if (!dateFields.length) return entity;

  const result = { ...entity };

  dateFields
    .filter(field => result[field] instanceof Date)
    .forEach(field => {
      result[field] = toZonedTime(result[field], DB_TIMEZONE);
    });

  return result;
}
