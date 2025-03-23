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
 */
export function getExcludedFields(
  classType: new (...args: unknown[]) => unknown,
  operation?: OperationType,
): string[] | Record<string, OperationType[]> {
  const className = classType.name;
  const classMetadata = exclusionMetadata.get(className);

  // 작업 타입이 지정되었으면 해당 작업에 대해 제외할 필드 목록 반환
  if (operation !== undefined) {
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

  // 작업 타입이 지정되지 않았으면 모든 메타데이터 반환
  const metadata: Record<string, OperationType[]> = {};

  if (classMetadata) {
    classMetadata.forEach((operations, field) => {
      metadata[field] = operations;
    });
  }

  return metadata;
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
      // 이 필드가 제외 대상이 아니라면 오류 발생 (필수 필드가 누락됨)
      if (!excludedFields.includes(key)) {
        throw new Error(`Required field ${key} is missing or null`);
      }
    }
  });

  return result;
}
