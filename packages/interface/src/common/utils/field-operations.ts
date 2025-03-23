import { z } from "zod";

// 작업 타입을 enum으로 정의
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

// 이전 데코레이터의 별칭으로 ExcludeFrom도 제공
export const ExcludeFrom = Exclude;

/**
 * 런타임에 클래스에서 특정 작업에 대해 제외된 필드 목록을 가져옵니다.
 */
export function getExcludedFields(
  classType: new (...args: unknown[]) => unknown,
  operation: OperationType,
): string[] {
  const className = classType.name;
  const classMetadata = exclusionMetadata.get(className);
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
 * 클래스의 스키마를 가져옵니다
 */
export function createSchemaFor(
  classType: { name: string },
  schema: z.ZodObject<z.ZodRawShape>,
  operation: OperationType,
): z.ZodObject<z.ZodRawShape> {
  const shape = { ...schema.shape };
  const className = classType.name;
  const classMetadata = exclusionMetadata.get(className);

  if (classMetadata) {
    classMetadata.forEach((operations, field) => {
      if (operations.includes(operation) && field in shape) {
        delete shape[field];
      }
    });
  }

  return z.object(shape);
}

/**
 * 데코레이터로 표시된 필드를 타입에서 제외
 * 실제 타입 시스템에서는 직접 지정한 필드가 사용되고,
 * 런타임에서는 데코레이터 메타데이터가 사용됩니다.
 */
export type ExcludeFieldsInOperation<
  T,
  C extends { [K in keyof T]?: unknown },
  O extends OperationType,
> = {
  [K in keyof T as K extends keyof C
    ? GetExcludeMetadata<C, K & string, O> extends true
      ? never
      : K
    : K]: T[K];
};

// 타입 레벨에서 메타데이터를 추출하는 헬퍼 타입
type GetExcludeMetadata<
  C extends { [key: string]: unknown },
  K extends keyof C & string,
  O extends OperationType,
> = K extends keyof C
  ? C[K] extends { __excludeFrom?: OperationType[] }
    ? C[K]["__excludeFrom"] extends OperationType[]
      ? O extends C[K]["__excludeFrom"][number]
        ? true
        : false
      : false
    : false
  : false;

/**
 * 단순 필드 제외 헬퍼
 */
export type ExcludeFieldsFromType<T, K extends keyof T> = Omit<T, K>;
