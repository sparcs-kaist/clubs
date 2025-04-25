export enum OperationType {
  CREATE = "create",
  PUT = "put",
}

export interface ClassConstructor<T = unknown> {
  new (...args: unknown[]): T;
  prototype: Record<string, unknown>;
}

// 클래스 생성자 -> 필드이름 -> 제외할 작업 타입 목록 맵
const exclusionMetadata = new Map<
  ClassConstructor,
  Map<string, OperationType[]>
>();

/**
 * 필드 메타데이터 데코레이터
 * 특정 작업에서 해당 필드를 제외하도록 함
 * @param operations 제외할 작업 타입들
 */
export function Exclude(...operations: OperationType[]): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const constructor = target.constructor as ClassConstructor;
    const key = propertyKey.toString();

    if (!exclusionMetadata.has(constructor)) {
      exclusionMetadata.set(constructor, new Map());
    }

    const classMetadata = exclusionMetadata.get(constructor);
    if (classMetadata) {
      classMetadata.set(key, operations);
    }
  };
}

/**
 * 클래스와 상위 클래스의 모든 메타데이터를 병합하여 가져옵니다.
 * @param constructor 클래스 생성자
 * @returns 병합된 메타데이터 맵
 */
function getMergedMetadata(
  constructor: ClassConstructor,
): Map<string, OperationType[]> {
  const result = new Map<string, OperationType[]>();

  // 상위 클래스부터 순회하여 메타데이터 병합
  let currentConstructor: ClassConstructor | null = constructor;

  while (
    currentConstructor &&
    currentConstructor !== Object.prototype.constructor
  ) {
    const metadata = exclusionMetadata.get(currentConstructor);

    if (metadata) {
      // 하위 클래스에서 오버라이드되지 않은 필드만 추가
      metadata.forEach((operations, field) => {
        if (!result.has(field)) {
          result.set(field, [...operations]);
        }
      });
    }

    // 상위 클래스로 이동
    currentConstructor = Object.getPrototypeOf(currentConstructor.prototype)
      ?.constructor as ClassConstructor | null;
  }

  return result;
}

/**
 * 런타임에 클래스에서 특정 작업에 대해 제외된 필드 목록을 가져옵니다.
 * @param classType 대상 클래스
 * @param operation 작업 타입 (선택적)
 * @returns 제외된 필드 목록 또는 모든 메타데이터
 */
export function getExcludedFields(
  classType: ClassConstructor,
  operation?: OperationType,
): string[] | Record<string, OperationType[]> {
  const mergedMetadata = getMergedMetadata(classType);

  if (!operation) {
    // 작업 타입이 제공되지 않으면 전체 메타데이터 반환
    const result: Record<string, OperationType[]> = {};
    mergedMetadata.forEach((ops, field) => {
      result[field] = [...ops];
    });
    return result;
  }

  // 특정 작업에 대한 제외 필드 목록 반환
  const excludedFields: string[] = [];
  mergedMetadata.forEach((operations, field) => {
    if (operations.includes(operation)) {
      excludedFields.push(field);
    }
  });

  return excludedFields;
}

/**
 * 특정 작업 타입에 따라 필드를 필터링하는 헬퍼 함수
 * 런타임에 사용됩니다.
 *
 * @param data 필터링할 객체
 * @param operation 작업 타입
 * @returns 필터링된 객체
 * @warning plain object로 반환하기에 차후 method나 prototype chain을 사용할 수 없음
 */
export function filterExcludedFields<T extends object>(
  data: T,
  operation: OperationType,
): T {
  // 객체의 생성자 함수를 가져옴
  const classType = Object.getPrototypeOf(data)
    .constructor as ClassConstructor<T>;

  const result = { ...data } as T;
  const excludedFields = getExcludedFields(classType, operation) as string[];

  // 클래스 프로토타입 가져오기
  const { prototype } = classType;

  // 클래스에 정의된 기본값을 저장할 객체
  const defaultValues: Record<string, unknown> = {};

  // 클래스에 정의된 모든 속성 및 기본값 수집
  // 상속 체인을 통해 모든 상위 클래스의 속성도 포함
  let currentPrototype = prototype;
  while (currentPrototype && currentPrototype !== Object.prototype) {
    // 현재 프로토타입에 정의된 속성 및 메서드 가져오기
    const propertyDescriptors =
      Object.getOwnPropertyDescriptors(currentPrototype);

    // 각 속성에 대해 기본값이 있는지 확인
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, descriptor] of Object.entries(propertyDescriptors)) {
      // 메서드나 getter/setter 제외
      if (
        typeof descriptor.value === "function" ||
        descriptor.get ||
        descriptor.set
      ) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // 이미 처리된 속성은 건너뛰기 (하위 클래스가 우선)
      if (key in defaultValues) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // 기본값이 있다면 저장
      if (descriptor.value !== undefined) {
        defaultValues[key] = descriptor.value;
      }
    }

    // 상위 프로토타입으로 이동
    currentPrototype = Object.getPrototypeOf(currentPrototype);
  }

  // 인스턴스의 값을 확인하여 추가 기본값 수집
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(data)) {
    if (excludedFields.includes(key) && value !== undefined) {
      defaultValues[key] = value;
    }
  }

  // 제외해야 할 필드 처리
  excludedFields.forEach(field => {
    if (field in result) {
      delete (result as Record<string, unknown>)[field];
    }
  });

  // 필수 필드 검증
  Object.keys(result).forEach(key => {
    // null 또는 undefined인 필드 검사
    const value = (result as Record<string, unknown>)[key];
    if (value === undefined || value === null) {
      // 이 필드가 제외 대상이 아니고 원래 nullable이 아닌 필드인 경우에만 오류 발생
      if (!excludedFields.includes(key)) {
        // 필드 속성 디스크립터를 통해 타입 정보 확인 (가능한 경우)
        const descriptor = Object.getOwnPropertyDescriptor(prototype, key);

        // 원래 nullable이나 optional로 정의된 필드인지 확인
        const isNullableOrOptionalField =
          descriptor?.get?.toString().includes("| null") ||
          descriptor?.get?.toString().includes("nullable") ||
          descriptor?.get?.toString().includes("?:") || // optional 필드 (예: field?: type)
          descriptor?.get?.toString().includes("| undefined") || // union with undefined
          key === "deletedAt" || // 기본적으로 deletedAt은 nullable
          key === "id"; // id 필드는 자동생성되므로 CREATE에서 제외

        if (!isNullableOrOptionalField) {
          throw new Error(`Required field ${key} is missing or null`);
        }
      }
    }
  });

  // 제외된 필드에 대한 기본값을 결과에 병합
  const finalResult = { ...result } as Record<string, unknown>;

  // 제외된 필드 중 기본값이 있는 경우에만 추가
  // eslint-disable-next-line no-restricted-syntax
  for (const field of excludedFields) {
    if (field in defaultValues) {
      finalResult[field] = defaultValues[field];
    }
  }

  return finalResult as T;
}
