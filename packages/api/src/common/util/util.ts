import { BadRequestException, NotFoundException } from "@nestjs/common";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { IdType } from "../model/entity.model";
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

type ModelInstance = { constructor: { modelName: string } };

/**
 * @description take function 에러 메시지에 띄울 name 만드는 함수
 */
const getModelName = (name?: string, model?: ModelInstance[] | null) =>
  name ??
  (Array.isArray(model) && model.length > 0
    ? model[0].constructor.modelName
    : "Model");

/**
 * @description 두 배열의 차이를 반환하는 함수
 * @description 중복되는 요소는 제외
 * @returns 합집합 - 교집합
 */
export function getArrayDiff<T extends string | number>(
  arr1: T[],
  arr2: T[],
): T[] {
  const union = new Set([...arr1, ...arr2]); // 합집합
  const intersection = new Set(arr1.filter(x => arr2.includes(x))); // 교집합

  // 합집합에서 교집합 요소를 제거
  return Array.from(union).filter(x => !intersection.has(x));
}

/**
 * @description 배열에서 하나만 가져오는 함수
 * @description 배열이 비어있으면 null을 반환
 */
export const takeOne = <T>(values: T[]): T | null => {
  // 하나를 가져올 때 쓰는 함수
  // 배열이 비어있으면 null을 반환
  if (values.length === 0) return null;
  return values[0];
};

/**
 * @description 길이가 1인 배열에서 하나만 가져오는 함수
 * @throws 배열이 비어있으면 NotFoundException 던짐
 * @throws 배열의 요소가 하나가 아니면 BadRequestException 던짐
 */
export function takeOnlyOne<T extends ModelInstance>(
  name?: string,
): (array: T[]) => T {
  return (array: T[]) => {
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
export function takeAll<
  M extends { id: Id } & ModelInstance,
  Id extends IdType,
>(ids: Id[], name?: string): (array: M[]) => M[] {
  return (array: M[]) => {
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
export function takeExist<M extends ModelInstance>(
  name?: string,
): (array: M[]) => M[] {
  return (array: M[]) => {
    if (array.length === 0)
      throw new NotFoundException(`${getModelName(name, array)} is empty`);
    return array;
  };
}
