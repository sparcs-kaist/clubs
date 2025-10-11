import { getDbInstance } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { Club } from "@sparcs-clubs/api/drizzle/schema/club.schema";
import { Division } from "@sparcs-clubs/api/drizzle/schema/division.schema";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import { Student, User } from "@sparcs-clubs/api/drizzle/schema/user.schema";

/**
 * 테스트용 기본 사용자 데이터
 */
export const TEST_USER = {
  sid: "test_user_001",
  name: "Test User",
  email: "test@example.com",
  phoneNumber: "010-1234-5678",
};

/**
 * 테스트용 기본 학생 데이터
 */
export const TEST_STUDENT = {
  number: 20200001,
  name: "Test Student",
  email: "student@kaist.ac.kr",
};

/**
 * 테스트용 기본 동아리 데이터
 */
export const TEST_CLUB = {
  nameKr: "테스트 동아리",
  nameEn: "Test Club",
  description: "This is a test club for E2E testing",
  foundingYear: 2020,
};

/**
 * 테스트용 기본 학기 데이터
 */
export const TEST_SEMESTER = {
  year: 2024,
  name: "2024 Fall",
};

/**
 * 테스트용 기본 분과 데이터
 */
export const TEST_DIVISION = {
  name: "Test Division",
};

/**
 * 기본 테스트 사용자 생성
 * @returns 생성된 사용자 객체
 */
export async function seedTestUser() {
  const db = await getDbInstance();

  const [user] = await db
    .insert(User)
    .values({
      sid: TEST_USER.sid,
      name: TEST_USER.name,
      email: TEST_USER.email,
      phoneNumber: TEST_USER.phoneNumber,
    })
    .$returningId();

  return user;
}

/**
 * 기본 테스트 학생 생성
 * @param userId - 연결할 사용자 ID (선택사항)
 * @returns 생성된 학생 객체
 */
export async function seedTestStudent(userId?: number) {
  const db = await getDbInstance();

  const [student] = await db
    .insert(Student)
    .values({
      userId: userId ?? null,
      number: TEST_STUDENT.number,
      name: TEST_STUDENT.name,
      email: TEST_STUDENT.email,
    })
    .$returningId();

  return student;
}

/**
 * 기본 테스트 분과 생성
 * @returns 생성된 분과 객체
 */
export async function seedTestDivision() {
  const db = await getDbInstance();

  const [division] = await db
    .insert(Division)
    .values({
      name: TEST_DIVISION.name,
    })
    .$returningId();

  return division;
}

/**
 * 기본 테스트 동아리 생성
 * @returns 생성된 동아리 객체
 */
export async function seedTestClub() {
  const db = await getDbInstance();

  const [club] = await db
    .insert(Club)
    .values({
      nameKr: TEST_CLUB.nameKr,
      nameEn: TEST_CLUB.nameEn,
      description: TEST_CLUB.description,
      foundingYear: TEST_CLUB.foundingYear,
    })
    .$returningId();

  return club;
}

/**
 * 기본 테스트 학기 생성
 * @returns 생성된 학기 객체
 */
export async function seedTestSemester() {
  const db = await getDbInstance();

  const [semester] = await db
    .insert(SemesterD)
    .values({
      year: TEST_SEMESTER.year,
      name: TEST_SEMESTER.name,
    })
    .$returningId();

  return semester;
}

/**
 * 전체 테스트 환경 구축
 * 사용자, 학생, 분과, 동아리, 학기를 모두 생성합니다.
 * @returns 생성된 모든 엔티티 객체
 */
export async function seedTestEnvironment() {
  const user = await seedTestUser();
  const student = await seedTestStudent(user.id);
  const division = await seedTestDivision();
  const club = await seedTestClub();
  const semester = await seedTestSemester();

  return {
    user,
    student,
    division,
    club,
    semester,
  };
}
