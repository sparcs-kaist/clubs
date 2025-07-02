import { z, ZodObject, ZodRawShape, type ZodTypeAny } from "zod";

// pickElement 함수 정의
export const zPickElement = <T extends ZodRawShape, K extends keyof T>(
  schema: ZodObject<T>,
  key: K,
): T[K] => {
  const pickedSchema = schema.pick({ key: true } as Record<keyof T, true>);
  return pickedSchema.shape[key];
};

// 이 함수는 입력값이 배열이 아니면 배열 형태로 변환하고,
// undefined/null인 경우 빈 배열로 변환하고,
// 배열인 경우 그대로 반환합니다.
/* 사용 예시
const requestQuery = z.object({
  clubIds: zQueryArray(zClub.pick({ id: true }).shape.id),
});
*/
export const zQueryArray = <T extends ZodTypeAny>(schema: T) =>
  z.preprocess(arg => {
    if (Array.isArray(arg)) {
      return arg;
    }
    if (arg === undefined || arg === null) {
      return [];
    }
    return [arg];
  }, z.array(schema));
