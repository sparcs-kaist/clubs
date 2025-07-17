import { BadRequestException, NotFoundException } from "@nestjs/common";
import { addHours } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { IdType, MEntity } from "../base/entity.model";
import { DB_TIMEZONE } from "./decorators/time-decorator";

export const isEmptyObject = obj =>
  obj && Object.keys(obj).length === 0 && obj.constructor === Object;

/**
 * @deprecated 예전 시간대 조정을 위해 사용했던 함수로, 차차 삭제해나가야 함
 * @description 주어진 날짜를 KST 기준으로 변환
 */

export function getKSTDate(input?: string | Date): Date {
  let date: Date;

  if (input === undefined || typeof input === "string") {
    date = input ? new Date(input) : new Date();

    // 현재 로컬 시간대의 오프셋을 구합니다 (분 단위).
    const timezoneOffset = date.getTimezoneOffset() * 60000; // 분을 밀리초로 변환

    // 오프셋을 적용하여 시간을 보정
    date.setTime(date.getTime() - timezoneOffset);
    return date;
  }
  return new Date(input);
}

export function getKSTDateForQuery(): Date {
  const date = new Date();
  const kstDateForQuery = addHours(date, 9); // KST는 UTC+9
  return kstDateForQuery;
}

/**
 * @param obj
 * @description 주어진 객체의 Date 프로퍼티들을 모두 DB에 넣을 수 있도록 KST 기준으로 변환
 * @description 중첩 객체도 가능
 * @warning 다만, plain object로 반환하기에 차후 method나 prototype chain을 사용할 수 없음
 * @example
 * ```ts
 * // IN to
 * const obj = makeObjectPropsToDBTimezone(this);
 * return CHANGE_TO_SCHEMA(obj);
 *
 * // IN query (select, count in base repository)
 * const where = makeObjectPropsToDBTimezone(whereClause);
 * ```
 */
export const makeObjectPropsToDBTimezone = <T extends object | unknown>(
  obj: T,
): T => {
  if (!obj) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj))
    return obj.map(item => makeObjectPropsToDBTimezone(item)) as T;
  if (obj instanceof Date) {
    return toZonedTime(obj, DB_TIMEZONE) as T;
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = makeObjectPropsToDBTimezone(value);
    return acc;
  }, {} as T);
};

/**
 * @param obj
 * @description 주어진 객체의 Date 프로퍼티들을 모두 DB에서 가져온 값을 UTC 기준으로 변환
 * @description FromDB에서 사용
 * @example
 * ```ts
 * // IN from
 * return new Model(makeObjectPropsFromDBTimezone(dbResult));
 * ```
 */
export const makeObjectPropsFromDBTimezone = <T extends object | unknown>(
  obj: T,
): T => {
  if (!obj) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj))
    return obj.map(item => makeObjectPropsFromDBTimezone(item)) as T;
  if (obj instanceof Date) {
    return fromZonedTime(obj, DB_TIMEZONE) as T;
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = makeObjectPropsFromDBTimezone(value);
    return acc;
  }, {} as T);
};

/**
 * @description: deletedAt:new Date() 를 시긴대 조정해서 반환
 * @description: delete 쿼리에서 사용
 */
export const getDeletedAtObject = (): { deletedAt: Date } =>
  makeObjectPropsToDBTimezone({ deletedAt: new Date() });

type ModelInstance<Id extends IdType> = InstanceType<typeof MEntity<Id>>;

type ModelClass<T extends MEntity<Id>, Id extends IdType> = {
  prototype: T;
  modelName: string;
  new (data: unknown): T;
};
/**
 * @description 모델의 에러 메시지에 사용할 이름을 반환하는 함수
 * @param name 직접 지정한 모델 이름 또는 모델 생성자
 * @param model 모델 인스턴스 배열
 * @returns 표시할 모델 이름
 */
const getModelName = <Id extends IdType>(
  name?: string | ModelClass<MEntity<Id>, Id>,
  model?: ModelInstance<Id>[] | null,
): string => {
  // 직접 지정된 이름이 있으면 사용
  if (typeof name === "string") {
    return name;
  }

  // ModelClass가 전달된 경우
  if (name?.modelName) {
    return name.modelName;
  }

  // 모델 인스턴스 배열에서 이름 추출 시도
  if (Array.isArray(model) && model.length > 0) {
    return (model[0].constructor as typeof MEntity).modelName;
  }

  // 기본값 반환
  return "Model"; // 배열 길이가 0인 경우는 어차피 알 수 없음...
};

/**
 * @description 두 배열의 차이를 반환하는 함수
 * @description 중복되는 요소는 제외
 * @returns 합집합 - 교집합
 */
export function getArrayDiff<T extends IdType>(arr1: T[], arr2: T[]): T[] {
  const union = new Set([...arr1, ...arr2]); // 합집합
  const intersection = new Set(arr1.filter(x => arr2.includes(x))); // 교집합

  // 합집합에서 교집합 요소를 제거
  return Array.from(union).filter(x => !intersection.has(x));
}

/**
 * @description 배열에서 하나만 가져오는 함수
 * @description 배열이 비어있으면 null을 반환
 */
export const takeOne = <M>(values: M[]): M | null => {
  if (values.length === 0) return null;
  return values[0];
};

/**
 * @description 길이가 1인 배열에서 하나만 가져오는 함수
 * @throws 배열이 비어있으면 NotFoundException 던짐
 * @throws 배열의 요소가 하나가 아니면 BadRequestException 던짐
 */
export function takeOnlyOne<M extends MEntity<Id>, Id extends IdType>(
  name?: string | ModelClass<M, Id>,
): (array: M[]) => M {
  return (array: M[]): M => {
    // 배열의 요소가 하나만 나왔는 지를 검증하는 함수
    // 배열의 요소가 하나가 아니면 예외 던짐
    if (array.length === 0)
      throw new NotFoundException(`${getModelName(name, array)} is empty`);
    if (array.length > 1)
      throw new BadRequestException(
        `${getModelName(name, array)} is not only one`,
      );
    return array[0];
  };
}

/**
 * @description 중복을 제외하고 배열을 반환하는 함수
 * @description JS 기본 자료형에 대해 잘 작동
 */
export function getUniqueArray<
  T extends string | number | boolean | symbol | null | undefined | bigint,
>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * @description 중복을 제외하고, 넣은 id가 모두 값이 잘 나왔는지를 체크해서 값을 얻는 함수
 * @description fetchAll에서 사용
 */
export function takeAll<M extends MEntity<Id>, Id extends IdType>(
  ids: Id[],
  name?: string | ModelClass<M, Id>,
): (array: M[]) => M[] {
  return (array: M[]): M[] => {
    const uniqueIds = getUniqueArray(ids);
    if (ids.some(id => !uniqueIds.includes(id))) {
      throw new NotFoundException(
        `The length of ${getModelName(name, array)} array does not match | id length: ${uniqueIds.length} || array length: ${array.length}`,
      );
    }
    return array;
  };
}

/**
 * @description 모델 배열이 비어있는 지 확인하고, 비어있으면 예외를 던지고, 비어있지 않으면 배열을 반환하는 함수
 */
export function takeExist<M extends MEntity<Id>, Id extends IdType>(
  name?: string | ModelClass<M, Id>,
): (array: M[]) => M[] {
  return (array: M[]) => {
    if (array.length === 0)
      throw new NotFoundException(`${getModelName(name, array)} is empty`);
    return array;
  };
}

/**
 * @description Data/배열 에서 id를 추출하는 함수
 * @description 배열이면 배열로 반환, 단일 객체면 단일 id만 반환
 * @deprecated 타입 추론이 명확하게 되지 않고 unknown 타입으로 반환되는 문제가 있어 폐기, 그냥 e=>e.id 쓰세용
 * @deprecated 저같은 실수를 반복하지 말라는 의미로 남겨는 둡니다
 */
export function takeId<M extends { id: T }, T>(data: M[]): T[];
export function takeId<M extends { id: T }, T>(data: M): T;
export function takeId<M extends { id: T }, T>(data: M | M[]): T | T[] {
  if (Array.isArray(data)) {
    return data.map(e => e.id);
  }
  return data.id;
}

/**
 * @description 단수 | 배열 오버로딩을 돕기 위해, 단수이면 배열로 만들어 주는 함수
 */
export const takeToArray = <T>(data: T | T[]): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
};

/**
 * @description 배열의 요소를 순서대로 실행하는 함수
 * @description async 함수를 순서대로 실행하는 것이 중요하다면 사용
 */
export async function forEachAsyncSequentially<T>(
  items: T[],
  runner: (item: T, index?: number) => Promise<void>,
): Promise<void> {
  await items.reduce(async (prev, item, idx) => {
    await prev;
    return runner(item, idx);
  }, Promise.resolve());
}
