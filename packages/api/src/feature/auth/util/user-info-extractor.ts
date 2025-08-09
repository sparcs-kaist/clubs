import { KaistV2Info } from "../dto/sparcs-sso.dto";

/**
 * 추출된 사용자 정보 인터페이스
 */
export interface ExtractedUserInfo {
  studentNumber: string;
  email: string;
  name: string;
  type: "Student" | "Professor" | "Employee";
  department: string;
  kaistUid: string;
  userId: string;
  departmentName: {
    korean: string;
    english: string;
  };
  status: string;
  programCode: string;
}

/**
 * 사용자 정보 추출 결과 래퍼
 */
export interface UserInfoExtractionResult {
  success: boolean;
  data?: ExtractedUserInfo;
  error?: string;
}

/**
 * V2의 socps_cd를 기존 시스템의 사용자 타입으로 변환
 * @param socpsCd - V2 소속 구분 코드 ('S': 학생, 'P': 교수, 'E': 직원 등)
 * @returns 기존 시스템 호환 타입 문자열
 */
export const getUserTypeFromSocpsCd = (
  socpsCd: string,
): "Student" | "Professor" | "Employee" => {
  if (!socpsCd) {
    return "Student";
  }

  switch (socpsCd.toUpperCase().trim()) {
    case "S":
      return "Student"; // 학생
    case "P":
      return "Professor"; // 교수
    case "E":
      return "Employee"; // 직원
    case "F":
      return "Professor"; // Faculty (교수진)
    case "R":
      return "Employee"; // Researcher (연구원)
    default:
      return "Student"; // 기본값
  }
};

/**
 * V2 정보에서 필요한 사용자 정보를 추출
 * @param kaistV2Info - SPARCS SSO V2 정보
 * @returns 시스템에서 사용할 표준화된 사용자 정보
 */
export const extractUserInfoFromV2 = (
  kaistV2Info: KaistV2Info,
): ExtractedUserInfo => {
  if (!kaistV2Info) {
    throw new Error("kaist_v2_info is required but not provided");
  }

  return {
    studentNumber: kaistV2Info.std_no || "",
    email: kaistV2Info.email || "",
    name: kaistV2Info.user_nm || "",
    type: getUserTypeFromSocpsCd(kaistV2Info.socps_cd),
    department: kaistV2Info.std_dept_id || "",
    // 추가 정보
    kaistUid: kaistV2Info.kaist_uid || "",
    userId: kaistV2Info.user_id || "",
    departmentName: {
      korean: kaistV2Info.std_dept_kor_nm || "",
      english: kaistV2Info.std_dept_eng_nm || "",
    },
    status: kaistV2Info.std_status_kor || "",
    programCode: kaistV2Info.std_prog_code || "",
  };
};

/**
 * V2 정보의 필수 필드 검증
 * @param kaistV2Info - 검증할 V2 정보
 * @returns 검증 결과 및 에러 메시지
 */
export const validateKaistV2Info = (
  kaistV2Info: KaistV2Info,
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!kaistV2Info) {
    errors.push("kaist_v2_info is null or undefined");
    return { isValid: false, errors };
  }

  // 필수 필드 검증
  const requiredFields = [
    "email", // 이메일
    "user_nm", // 이름
    "socps_cd", // 소속 구분
  ];

  // 추가 필수 필드 (사용자 타입에 따라)
  const conditionalFields = [
    {
      field: "std_no",
      condition: (info: KaistV2Info) => info.socps_cd === "S",
      description: "학생인 경우 학번",
    },
    {
      field: "std_dept_id",
      condition: (info: KaistV2Info) => info.socps_cd === "S",
      description: "학생인 경우 학과 ID",
    },
  ];

  // 기본 필수 필드 검증
  requiredFields.forEach(field => {
    if (!kaistV2Info[field] || kaistV2Info[field].toString().trim() === "") {
      errors.push(`Required field '${field}' is missing or empty`);
    }
  });

  // 조건부 필수 필드 검증
  conditionalFields.forEach(({ field, condition, description }) => {
    if (
      condition(kaistV2Info) &&
      (!kaistV2Info[field] || kaistV2Info[field].toString().trim() === "")
    ) {
      errors.push(
        `Required field '${field}' is missing or empty (${description})`,
      );
    }
  });

  // 이메일 형식 검증
  if (kaistV2Info.email && !kaistV2Info.email.includes("@")) {
    errors.push("Invalid email format - must contain @");
  }

  // 학번 형식 검증 (학생인 경우)
  if (kaistV2Info.socps_cd === "S" && kaistV2Info.std_no) {
    if (!/^\d{6,10}$/.test(kaistV2Info.std_no)) {
      errors.push("Invalid student number format - should be 6-10 digits");
    }
  }

  // socps_cd 유효성 검증
  const validSocpsCodes = ["S", "P", "E", "F", "R"];
  if (
    kaistV2Info.socps_cd &&
    !validSocpsCodes.includes(kaistV2Info.socps_cd.toUpperCase())
  ) {
    errors.push(
      `Invalid socps_cd '${kaistV2Info.socps_cd}' - must be one of: ${validSocpsCodes.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * V2 정보를 안전하게 추출하는 헬퍼 함수
 * @param kaistV2Info - 추출할 V2 정보
 * @returns 추출 결과 (성공/실패 및 데이터/에러)
 */
export const safeExtractUserInfoFromV2 = (
  kaistV2Info: KaistV2Info,
): UserInfoExtractionResult => {
  try {
    // 먼저 검증
    const validation = validateKaistV2Info(kaistV2Info);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // 추출
    const data = extractUserInfoFromV2(kaistV2Info as KaistV2Info);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during extraction",
    };
  }
};
