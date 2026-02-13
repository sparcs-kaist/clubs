/**
 * 모든 Entity의 Base 클래스 (TypeORM 의존성 제거됨)
 * 공통 필드: id, createdAt, updatedAt, deletedAt
 * 참고: Prisma에서는 schema.prisma에서 모델이 정의되므로
 *       이 클래스는 도메인 모델의 공통 인터페이스로만 사용됨
 */
export abstract class BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
