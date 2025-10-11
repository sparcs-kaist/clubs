import { sql } from "drizzle-orm";

import {
  getConnection,
  getDbInstance,
} from "@sparcs-clubs/api/drizzle/drizzle.provider";

/**
 * 테스트 전 DB 초기화
 * 모든 테이블의 데이터를 삭제하여 깨끗한 상태로 만듭니다.
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDbInstance();

  try {
    // 외래키 제약 조건 임시 비활성화
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    // 현재 데이터베이스의 모든 테이블 목록 조회
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
    `);

    // 각 테이블의 데이터 삭제 (순차 처리)
    const tableRows = (result.rows || result) as Array<{ table_name: string }>;
    await tableRows.reduce(async (promise, row) => {
      await promise;
      if (row.table_name) {
        await db.execute(sql.raw(`TRUNCATE TABLE \`${row.table_name}\``));
      }
    }, Promise.resolve());

    // 외래키 제약 조건 재활성화
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  } catch (error) {
    // 에러 발생 시 외래키 제약 조건 복구
    try {
      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
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
  const connection = await getConnection();
  await connection.end();
}
