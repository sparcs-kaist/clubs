import { fromZonedTime, toZonedTime } from "date-fns-tz";

// timezone 관련 문제를 해결하기 위한 데코레이터 및 adjust 함수
// 근데 class method 및 object 프로퍼티에 대해서는 적용되지 않아서... 폐기...

const DATE_FIELD_KEY = Symbol("date-field");
export const DB_TIMEZONE = "Asia/Seoul";

/**
 * @description date 필드를 기록해서 추가 작업을 하기 위해 메타데이터에 기록하는 데코레이터
 * @deprecated Server UTC <-> DB KST 로 하면 항상 9시간 차이임이 보장되어 폐기
 */
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

/**
 * @deprecated 클래스 메서드 및 프로토타입이 사라지는 이슈 때문에 폐기
 */
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

/**
 * @deprecated 하위 object의 date 필드를 감지하지 못하는 이슈
 */
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
