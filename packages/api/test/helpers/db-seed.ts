import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  name: "Fall",
  startTerm: new Date("2024-09-01"),
  endTerm: new Date("2024-12-31"),
};

/**
 * 테스트용 기본 지구 데이터
 */
export const TEST_DISTRICT = {
  name: "Test Dist",
};

/**
 * 테스트용 기본 분과 데이터
 */
export const TEST_DIVISION = {
  name: "Test Div",
  startTerm: new Date("2024-03-01"),
};

/**
 * 기본 테스트 사용자 생성
 * @returns 생성된 사용자 객체
 */
export async function seedTestUser() {
  const result = await prisma.user.create({
    data: {
      sid: TEST_USER.sid,
      name: TEST_USER.name,
      email: TEST_USER.email,
      phoneNumber: TEST_USER.phoneNumber,
    },
  });

  return { id: result.id };
}

/**
 * 기본 테스트 학생 생성
 * @param userId - 연결할 사용자 ID (선택사항)
 * @returns 생성된 학생 객체
 */
export async function seedTestStudent(userId?: number) {
  const result = await prisma.student.create({
    data: {
      userId: userId ?? null,
      number: TEST_STUDENT.number,
      name: TEST_STUDENT.name,
      email: TEST_STUDENT.email,
    },
  });

  return { id: result.id };
}

/**
 * 기본 테스트 지구 생성
 * @returns 생성된 지구 객체
 */
export async function seedTestDistrict() {
  const result = await prisma.district.create({
    data: {
      name: TEST_DISTRICT.name,
    },
  });

  return { id: result.id };
}

/**
 * 기본 테스트 분과 생성
 * @param districtId - 연결할 지구 ID (선택사항)
 * @returns 생성된 분과 객체
 */
export async function seedTestDivision(districtId?: number) {
  // districtId가 없으면 새로 생성
  const finalDistrictId = districtId ?? (await seedTestDistrict()).id;

  const result = await prisma.division.create({
    data: {
      name: TEST_DIVISION.name,
      startTerm: TEST_DIVISION.startTerm,
      districtId: finalDistrictId,
    },
  });

  return { id: result.id };
}

/**
 * 기본 테스트 동아리 생성
 * @param divisionId - 연결할 분과 ID (선택사항)
 * @returns 생성된 동아리 객체
 */
export async function seedTestClub(divisionId?: number) {
  // divisionId가 없으면 새로 생성
  const finalDivisionId = divisionId ?? (await seedTestDivision()).id;

  const result = await prisma.club.create({
    data: {
      nameKr: TEST_CLUB.nameKr,
      nameEn: TEST_CLUB.nameEn,
      description: TEST_CLUB.description,
      foundingYear: TEST_CLUB.foundingYear,
    },
  });

  // Club과 Division의 관계는 ClubDivisionHistory를 통해 설정
  await prisma.clubDivisionHistory.create({
    data: {
      clubId: result.id,
      divisionId: finalDivisionId,
      startTerm: new Date(),
    },
  });

  return { id: result.id };
}

/**
 * 기본 테스트 학기 생성
 * @returns 생성된 학기 객체
 */
export async function seedTestSemester() {
  const result = await prisma.semesterD.create({
    data: {
      year: TEST_SEMESTER.year,
      name: TEST_SEMESTER.name,
      startTerm: TEST_SEMESTER.startTerm,
      endTerm: TEST_SEMESTER.endTerm,
    },
  });

  return { id: result.id };
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
