import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 테스트 전 DB 초기화
 * 모든 테이블의 데이터를 삭제하여 깨끗한 상태로 만듭니다.
 */
export async function clearDatabase(): Promise<void> {
  try {
    // 외래키 제약 조건 임시 비활성화
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

    // 현재 데이터베이스의 모든 테이블 목록 조회
    const tables: Array<{ TABLE_NAME: string }> = await prisma.$queryRaw`
      SELECT table_name AS TABLE_NAME
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
    `;

    // 각 테이블의 데이터 삭제 (순차 처리)
    await tables.reduce(async (promise, row) => {
      await promise;
      if (row && row.TABLE_NAME) {
        await prisma.$executeRaw(
          Prisma.sql`TRUNCATE TABLE ${Prisma.raw(`\`${row.TABLE_NAME}\``)}`,
        );
      }
    }, Promise.resolve());

    // 외래키 제약 조건 재활성화
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  } catch (error) {
    // 에러 발생 시 외래키 제약 조건 복구
    try {
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    } catch {
      // 복구 실패 시 무시
    }
    throw error;
  }
}

/**
 * 테스트 후 DB 연결 정리
 * 테스트가 완전히 종료된 후 데이터베이스 연결을 종료합니다.
 */
export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}
