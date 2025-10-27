import { KaistV2Info } from "@sparcs-clubs/api/feature/auth/dto/sparcs-sso.dto";
import {
  extractUserInfoFromV2,
  getUserTypeFromSocpsCd,
  safeExtractUserInfoFromV2,
  validateKaistV2Info,
} from "@sparcs-clubs/api/feature/auth/util/user-info-extractor";

describe("User Info Extractor (Unit)", () => {
  describe("getUserTypeFromSocpsCd", () => {
    it("should return Student for S", () => {
      expect(getUserTypeFromSocpsCd("S")).toBe("Student");
    });

    it("should return Professor for P", () => {
      expect(getUserTypeFromSocpsCd("P")).toBe("Professor");
    });

    it("should return Professor for PA (Professor Associate)", () => {
      expect(getUserTypeFromSocpsCd("PA")).toBe("Professor");
    });

    it("should return Employee for E", () => {
      expect(getUserTypeFromSocpsCd("E")).toBe("Employee");
    });

    it("should return Professor for F (Faculty)", () => {
      expect(getUserTypeFromSocpsCd("F")).toBe("Professor");
    });

    it("should return Employee for R (Researcher)", () => {
      expect(getUserTypeFromSocpsCd("R")).toBe("Employee");
    });

    it("should default to Student for unknown codes", () => {
      expect(getUserTypeFromSocpsCd("X")).toBe("Student");
      expect(getUserTypeFromSocpsCd("Z")).toBe("Student");
    });

    it("should handle case insensitive input", () => {
      expect(getUserTypeFromSocpsCd("s")).toBe("Student");
      expect(getUserTypeFromSocpsCd("p")).toBe("Professor");
      expect(getUserTypeFromSocpsCd("e")).toBe("Employee");
    });

    it("should handle whitespace in input", () => {
      expect(getUserTypeFromSocpsCd(" S ")).toBe("Student");
      expect(getUserTypeFromSocpsCd("\tP\t")).toBe("Professor");
    });

    it("should handle empty or null input", () => {
      expect(getUserTypeFromSocpsCd("")).toBe("Student");
      expect(getUserTypeFromSocpsCd(null as unknown as string)).toBe("Student");
      expect(getUserTypeFromSocpsCd(undefined as unknown as string)).toBe(
        "Student",
      );
    });
  });

  describe("validateKaistV2Info", () => {
    const createValidV2Info = (
      overrides: Partial<KaistV2Info> = {},
    ): KaistV2Info => ({
      kaist_uid: "test_uid",
      user_eng_nm: "Kim, Student",
      login_type: "L004",
      std_dept_kor_nm: "전기및전자공학부",
      std_dept_eng_nm: "School of Electrical Engineering",
      user_nm: "김학생",
      busn_phone: null,
      std_status_kor: "재학",
      std_dept_id: "4423",
      ebs_user_status_kor: null,
      std_no: "20180036",
      user_id: "student123",
      camps_div_cd: "D",
      socps_cd: "S",
      email: "student@kaist.ac.kr",
      std_prog_code: "0",
      kaist_org_id: "4423",
      // 교수/직원 필드들 (기본값)
      emp_dept_id: "20686",
      emp_dept_kor_nm: "디지털인문사회과학부",
      emp_dept_eng_nm:
        "School of Digital Humanities and Computational Social Sciences",
      emp_no: "1267",
      emp_status_kor: "재직",
      ...overrides,
    });

    it("should validate correct V2 info for student", () => {
      const validInfo = createValidV2Info();
      const result = validateKaistV2Info(validInfo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate correct V2 info for professor", () => {
      const validInfo = createValidV2Info({
        socps_cd: "P",
        std_no: "", // 교수는 학번이 없을 수 있음
        std_dept_id: "4423",
      });
      const result = validateKaistV2Info(validInfo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject null or undefined input", () => {
      const result1 = validateKaistV2Info(null);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("kaist_v2_info is null or undefined");

      const result2 = validateKaistV2Info(undefined);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain("kaist_v2_info is null or undefined");
    });

    it("should reject missing required fields", () => {
      const invalidInfo = createValidV2Info({ email: "" });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Required field 'email' is missing or empty",
      );
    });

    it("should reject invalid email format", () => {
      const invalidInfo = createValidV2Info({ email: "invalid-email" });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid email format - must contain @");
    });

    it("should reject invalid student number format for students", () => {
      const invalidInfo = createValidV2Info({
        socps_cd: "S",
        std_no: "123", // 너무 짧음
      });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid student number format - should be 6-10 digits",
      );
    });

    it("should reject invalid socps_cd", () => {
      const invalidInfo = createValidV2Info({ socps_cd: "X" });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid socps_cd 'X' - must be one of: S, P, PA, E, F, R",
      );
    });

    it("should require std_no for students", () => {
      const invalidInfo = createValidV2Info({
        socps_cd: "S",
        std_no: "",
      });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Required field 'std_no' is missing or empty (학생인 경우 학번)",
      );
    });

    it("should require std_dept_id for students", () => {
      const invalidInfo = createValidV2Info({
        socps_cd: "S",
        std_dept_id: "",
      });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Required field 'std_dept_id' is missing or empty (학생인 경우 학과 ID)",
      );
    });

    it("should accept valid student numbers", () => {
      const validNumbers = ["20180036", "201812345", "123456"];

      validNumbers.forEach(stdNo => {
        const validInfo = createValidV2Info({
          socps_cd: "S",
          std_no: stdNo,
        });
        const result = validateKaistV2Info(validInfo);

        expect(result.isValid).toBe(true);
      });
    });

    // 교수/직원 관련 새로운 테스트 케이스들
    it("should require emp_dept_id for professors", () => {
      const invalidInfo = createValidV2Info({
        socps_cd: "P",
        emp_dept_id: "",
      });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Required field 'emp_dept_id' is missing or empty (교수/직원인 경우 부서 ID)",
      );
    });

    it("should require emp_no for professors", () => {
      const invalidInfo = createValidV2Info({
        socps_cd: "P",
        emp_no: "",
      });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Required field 'emp_no' is missing or empty (교수/직원인 경우 직원 번호)",
      );
    });

    it("should require emp_dept_id for employees", () => {
      const invalidInfo = createValidV2Info({
        socps_cd: "E",
        emp_dept_id: "",
      });
      const result = validateKaistV2Info(invalidInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Required field 'emp_dept_id' is missing or empty (교수/직원인 경우 부서 ID)",
      );
    });

    it("should validate all professor/employee types correctly", () => {
      const professorEmployeeTypes = ["P", "PA", "E", "F", "R"];

      professorEmployeeTypes.forEach(socpsCd => {
        const validInfo = createValidV2Info({
          socps_cd: socpsCd,
          emp_dept_id: "20686",
          emp_no: "1267",
        });
        const result = validateKaistV2Info(validInfo);

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("extractUserInfoFromV2", () => {
    const createValidV2Info = (
      overrides: Partial<KaistV2Info> = {},
    ): KaistV2Info => ({
      kaist_uid: "test_uid",
      user_eng_nm: "Kim, Student",
      login_type: "L004",
      std_dept_kor_nm: "전기및전자공학부",
      std_dept_eng_nm: "School of Electrical Engineering",
      user_nm: "김학생",
      busn_phone: null,
      std_status_kor: "재학",
      std_dept_id: "4423",
      ebs_user_status_kor: null,
      std_no: "20180036",
      user_id: "student123",
      camps_div_cd: "D",
      socps_cd: "S",
      email: "student@kaist.ac.kr",
      std_prog_code: "0",
      kaist_org_id: "4423",
      // 교수/직원 필드들 (기본값)
      emp_dept_id: "20686",
      emp_dept_kor_nm: "디지털인문사회과학부",
      emp_dept_eng_nm:
        "School of Digital Humanities and Computational Social Sciences",
      emp_no: "1267",
      emp_status_kor: "재직",
      ...overrides,
    });

    it("should extract student information correctly", () => {
      const v2Info = createValidV2Info();
      const result = extractUserInfoFromV2(v2Info);

      expect(result).toEqual({
        studentNumber: "20180036",
        email: "student@kaist.ac.kr",
        name: "김학생",
        type: "Student",
        department: "4423",
        kaistUid: "test_uid",
        userId: "student123",
        departmentName: {
          korean: "전기및전자공학부",
          english: "School of Electrical Engineering",
        },
        status: "재학",
        programCode: "0",
      });
    });

    it("should extract professor information correctly", () => {
      const v2Info = createValidV2Info({
        socps_cd: "P",
        user_nm: "김교수",
        std_no: "",
        std_status_kor: "재직",
      });
      const result = extractUserInfoFromV2(v2Info);

      expect(result.type).toBe("Professor");
      expect(result.name).toBe("김교수");
      expect(result.status).toBe("재직");
      expect(result.studentNumber).toBe("");
    });

    it("should extract employee information correctly", () => {
      const v2Info = createValidV2Info({
        socps_cd: "E",
        user_nm: "김직원",
        std_no: "",
        std_status_kor: "재직",
      });
      const result = extractUserInfoFromV2(v2Info);

      expect(result.type).toBe("Employee");
      expect(result.name).toBe("김직원");
      expect(result.status).toBe("재직");
    });

    it("should throw error for null input", () => {
      expect(() => {
        extractUserInfoFromV2(null as unknown as KaistV2Info);
      }).toThrow("kaist_v2_info is required but not provided");
    });

    it("should handle missing optional fields gracefully", () => {
      const minimalV2Info = {
        socps_cd: "S",
        email: "test@kaist.ac.kr",
        user_nm: "테스트",
        std_no: "20180036",
        std_dept_id: "4423",
        kaist_uid: "",
        user_eng_nm: "",
        login_type: "",
        std_dept_kor_nm: "",
        std_dept_eng_nm: "",
        busn_phone: null,
        std_status_kor: "",
        ebs_user_status_kor: null,
        user_id: "",
        camps_div_cd: "",
        std_prog_code: "",
        kaist_org_id: "",
      } as KaistV2Info;

      const result = extractUserInfoFromV2(minimalV2Info);

      expect(result.email).toBe("test@kaist.ac.kr");
      expect(result.name).toBe("테스트");
      expect(result.type).toBe("Student");
      expect(result.kaistUid).toBe("");
      expect(result.departmentName.korean).toBe("");
    });

    it("should map all socps_cd types correctly", () => {
      const testCases = [
        { socps_cd: "S", expectedType: "Student" },
        { socps_cd: "P", expectedType: "Professor" },
        { socps_cd: "PA", expectedType: "Professor" },
        { socps_cd: "E", expectedType: "Employee" },
        { socps_cd: "F", expectedType: "Professor" },
        { socps_cd: "R", expectedType: "Employee" },
      ];

      testCases.forEach(({ socps_cd: socpsCd, expectedType }) => {
        const v2Info = createValidV2Info({ socps_cd: socpsCd });
        const result = extractUserInfoFromV2(v2Info);

        expect(result.type).toBe(expectedType);
      });
    });

    // 교수/직원 필드 사용에 대한 새로운 테스트 케이스들
    it("should use employee fields for professors", () => {
      const v2Info = createValidV2Info({
        socps_cd: "P",
        user_nm: "전봉관",
        emp_dept_id: "20686",
        emp_dept_kor_nm: "디지털인문사회과학부",
        emp_dept_eng_nm:
          "School of Digital Humanities and Computational Social Sciences",
        emp_status_kor: "재직",
        // 학생 필드들은 무시되어야 함
        std_dept_id: "4423",
        std_dept_kor_nm: "전기및전자공학부",
        std_dept_eng_nm: "School of Electrical Engineering",
        std_status_kor: "재학",
      });
      const result = extractUserInfoFromV2(v2Info);

      expect(result.type).toBe("Professor");
      expect(result.name).toBe("전봉관");
      expect(result.department).toBe("20686"); // emp_dept_id 사용
      expect(result.departmentName.korean).toBe("디지털인문사회과학부"); // emp_dept_kor_nm 사용
      expect(result.departmentName.english).toBe(
        "School of Digital Humanities and Computational Social Sciences",
      ); // emp_dept_eng_nm 사용
      expect(result.status).toBe("재직"); // emp_status_kor 사용
    });

    it("should use employee fields for employees", () => {
      const v2Info = createValidV2Info({
        socps_cd: "E",
        user_nm: "김직원",
        emp_dept_id: "12345",
        emp_dept_kor_nm: "행정부서",
        emp_dept_eng_nm: "Administrative Department",
        emp_status_kor: "재직",
      });
      const result = extractUserInfoFromV2(v2Info);

      expect(result.type).toBe("Employee");
      expect(result.name).toBe("김직원");
      expect(result.department).toBe("12345");
      expect(result.departmentName.korean).toBe("행정부서");
      expect(result.departmentName.english).toBe("Administrative Department");
      expect(result.status).toBe("재직");
    });

    it("should use student fields for students", () => {
      const v2Info = createValidV2Info({
        socps_cd: "S",
        user_nm: "김학생",
        std_dept_id: "4423",
        std_dept_kor_nm: "전기및전자공학부",
        std_dept_eng_nm: "School of Electrical Engineering",
        std_status_kor: "재학",
        // 교수 필드들은 무시되어야 함
        emp_dept_id: "20686",
        emp_dept_kor_nm: "디지털인문사회과학부",
        emp_dept_eng_nm:
          "School of Digital Humanities and Computational Social Sciences",
        emp_status_kor: "재직",
      });
      const result = extractUserInfoFromV2(v2Info);

      expect(result.type).toBe("Student");
      expect(result.name).toBe("김학생");
      expect(result.department).toBe("4423"); // std_dept_id 사용
      expect(result.departmentName.korean).toBe("전기및전자공학부"); // std_dept_kor_nm 사용
      expect(result.departmentName.english).toBe(
        "School of Electrical Engineering",
      ); // std_dept_eng_nm 사용
      expect(result.status).toBe("재학"); // std_status_kor 사용
    });

    it("should handle missing employee fields gracefully for professors", () => {
      const v2Info = createValidV2Info({
        socps_cd: "P",
        emp_dept_id: "",
        emp_dept_kor_nm: "",
        emp_dept_eng_nm: "",
        emp_status_kor: "",
      });
      const result = extractUserInfoFromV2(v2Info);

      expect(result.type).toBe("Professor");
      expect(result.department).toBe(""); // 빈 문자열로 처리
      expect(result.departmentName.korean).toBe("");
      expect(result.departmentName.english).toBe("");
      expect(result.status).toBe("");
    });

    it("should handle missing student fields gracefully for students", () => {
      const v2Info = createValidV2Info({
        socps_cd: "S",
        std_dept_id: "",
        std_dept_kor_nm: "",
        std_dept_eng_nm: "",
        std_status_kor: "",
      });
      const result = extractUserInfoFromV2(v2Info);

      expect(result.type).toBe("Student");
      expect(result.department).toBe(""); // 빈 문자열로 처리
      expect(result.departmentName.korean).toBe("");
      expect(result.departmentName.english).toBe("");
      expect(result.status).toBe("");
    });
  });

  describe("safeExtractUserInfoFromV2", () => {
    const createValidV2Info = (): KaistV2Info => ({
      kaist_uid: "test_uid",
      user_eng_nm: "Kim, Student",
      login_type: "L004",
      std_dept_kor_nm: "전기및전자공학부",
      std_dept_eng_nm: "School of Electrical Engineering",
      user_nm: "김학생",
      busn_phone: null,
      std_status_kor: "재학",
      std_dept_id: "4423",
      ebs_user_status_kor: null,
      std_no: "20180036",
      user_id: "student123",
      camps_div_cd: "D",
      socps_cd: "S",
      email: "student@kaist.ac.kr",
      std_prog_code: "0",
      kaist_org_id: "4423",
      // 교수/직원 필드들 (기본값)
      emp_dept_id: "20686",
      emp_dept_kor_nm: "디지털인문사회과학부",
      emp_dept_eng_nm:
        "School of Digital Humanities and Computational Social Sciences",
      emp_no: "1267",
      emp_status_kor: "재직",
    });

    it("should return success result for valid input", () => {
      const validInfo = createValidV2Info();
      const result = safeExtractUserInfoFromV2(validInfo);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe("student@kaist.ac.kr");
      expect(result.data?.type).toBe("Student");
      expect(result.error).toBeUndefined();
    });

    it("should return error result for invalid input", () => {
      const invalidInfo = { email: "invalid-email" };
      const result = safeExtractUserInfoFromV2(invalidInfo);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toContain("Validation failed");
    });

    it("should return error result for null input", () => {
      const result = safeExtractUserInfoFromV2(null);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toContain("kaist_v2_info is null or undefined");
    });

    it("should handle multiple validation errors", () => {
      const invalidInfo = {
        email: "invalid-email", // 잘못된 이메일
        socps_cd: "X", // 잘못된 소속 코드
        user_nm: "", // 빈 이름
      };
      const result = safeExtractUserInfoFromV2(invalidInfo);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Validation failed");
      expect(result.error).toContain("Invalid email format");
      expect(result.error).toContain("Invalid socps_cd");
      expect(result.error).toContain("Required field");
    });

    it("should preserve error context in failure cases", () => {
      const result = safeExtractUserInfoFromV2(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe("string");
    });
  });
});
