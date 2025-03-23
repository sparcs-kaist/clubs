export enum OperationType {
  CREATE = "create",
  PUT = "put",
}

// 필드 메타데이터 저장소 (클래스이름 -> 필드이름 -> 제외할 작업 타입 목록)
const exclusionMetadata = new Map<string, Map<string, OperationType[]>>();

/**
 * 필드 메타데이터 데코레이터
 * 특정 작업에서 해당 필드를 제외하도록 함
 * @param operations 제외할 작업 타입들
 */
export function Exclude(...operations: OperationType[]): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const className = target.constructor.name;
    const key = propertyKey.toString();

    if (!exclusionMetadata.has(className)) {
      exclusionMetadata.set(className, new Map());
    }

    const classMetadata = exclusionMetadata.get(className);
    if (classMetadata) {
      classMetadata.set(key, operations);
    }
  };
}

/**
 * 런타임에 클래스에서 특정 작업에 대해 제외된 필드 목록을 가져옵니다.
 * @param classType 대상 클래스
 * @param operation 작업 타입 (선택적)
 * @returns 제외된 필드 목록 또는 모든 메타데이터
 */
export function getExcludedFields(
  classType: new (...args: unknown[]) => unknown,
  operation?: OperationType,
): string[] | Record<string, OperationType[]> {
  const className = classType.name;
  const classMetadata = exclusionMetadata.get(className);

  if (!operation) {
    // 작업 타입이 제공되지 않으면 전체 메타데이터 반환
    const result: Record<string, OperationType[]> = {};
    if (classMetadata) {
      classMetadata.forEach((ops, field) => {
        result[field] = [...ops];
      });
    }
    return result;
  }

  // 특정 작업에 대한 제외 필드 목록 반환
  const excludedFields: string[] = [];
  if (classMetadata) {
    classMetadata.forEach((operations, field) => {
      if (operations.includes(operation)) {
        excludedFields.push(field);
      }
    });
  }

  return excludedFields;
}

/**
 * 특정 작업 타입에 따라 필드를 필터링하는 헬퍼 함수
 * 런타임에 사용됩니다.
 *
 * @param data 필터링할 객체
 * @param classType 데코레이터가 적용된 클래스 타입
 * @param operation 작업 타입
 * @returns 필터링된 객체
 */
export function filterExcludedFields<T extends object>(
  data: T,
  classType: new (...args: unknown[]) => unknown,
  operation: OperationType,
): T {
  const result = { ...data } as T;
  const excludedFields = getExcludedFields(classType, operation) as string[];

  // 클래스 프로토타입 가져오기
  const { prototype } = classType;

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
          key === "deletedAt"; // 기본적으로 deletedAt은 nullable

        if (!isNullableOrOptionalField) {
          throw new Error(`Required field ${key} is missing or null`);
        }
      }
    }
  });

  return result;
}
