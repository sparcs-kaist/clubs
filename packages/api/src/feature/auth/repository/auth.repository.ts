import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { UserSsoLoginRepository } from "@sparcs-clubs/api/feature/user/repository/sso-login/user-sso-login.repository";

import type { SsoLoginDiagnostic } from "../util/sso-login-diagnostic";
import { AuthExchangeLoginRepository } from "./exchange-login/auth-exchange-login.repository";

interface FindOrCreateUserReturn {
  id: number;
  sid: string;
  name: string;
  email: string;
  undergraduate?: {
    id: number;
    number: number;
  };
  master?: {
    id: number;
    number: number;
  };
  doctor?: {
    id: number;
    number: number;
  };
  executive?: {
    id: number;
    studentId: number;
  };
  professor?: {
    id: number;
  };
  employee?: {
    id: number;
  };
}

type StudentProfile = Pick<
  FindOrCreateUserReturn,
  "undergraduate" | "master" | "doctor"
>;

type StudentProfileKey = keyof StudentProfile;

const studentProfileKeyByEnum = new Map<number, StudentProfileKey>([
  [1, "undergraduate"],
  [2, "master"],
  [3, "doctor"],
]);

const getStudentNumberSuffix = (studentNumber: string | number) =>
  Number(studentNumber.toString().slice(-4));

const FALLBACK_STUDENT_ENUM_ERROR_MESSAGE =
  "교환학생의 학적 정보를 추적할 수 없습니다. 관리자에게 문의해주세요.";

@Injectable()
export class AuthRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
    private readonly userSsoLoginRepository: UserSsoLoginRepository,
    private readonly authExchangeLoginRepository: AuthExchangeLoginRepository,
  ) {}

  // 기존 조회도 로그인 저장 작업과 같은 트랜잭션의 데이터를 읽습니다.
  private get prisma() {
    return this.txHost.tx;
  }

  async findOrCreateUser(
    email: string,
    studentNumber: string,
    sid: string,
    name: string,
    type: string,
    department: string,
    typeV2: string,
    statusV2: string | null,
    progCodeV2: string | null,
    diagnostic?: SsoLoginDiagnostic,
  ): Promise<FindOrCreateUserReturn> {
    const context = diagnostic ?? { stage: "db.user.upsert" };
    const db = context.db ?? {};
    context.db = db;
    context.stage = "db.user.upsert";
    await this.userSsoLoginRepository.ensureUser({ sid, name, email });

    context.stage = "db.user.read";
    db.userQueriedAt = this.clock.now();
    const user = await this.prisma.user
      .findMany({
        where: { email, deletedAt: null },
      })
      .then(takeOne);

    db.user = user ? { id: user.id, deletedAt: user.deletedAt } : null;
    context.userId = user?.id;

    let result: FindOrCreateUserReturn = {
      id: user.id,
      sid: user.sid,
      name: user.name,
      email: user.email,
    };

    // 오늘 날짜를 기준으로 semester_d 테이블에서 해당 학기를 찾아서 semester_id, startTerm, endTerm을 가져옴
    context.stage = "db.semester.read";
    const currentDate = this.clock.now();
    db.semesterQueriedAt = currentDate;
    const semester = await this.prisma.semesterD
      .findMany({
        where: {
          startTerm: { lte: currentDate },
          endTerm: { gte: currentDate },
          deletedAt: null,
        },
      })
      .then(takeOne);

    db.semester = semester
      ? {
          id: semester.id,
          year: semester.year,
          name: semester.name,
          startTerm: semester.startTerm,
          endTerm: semester.endTerm,
          deletedAt: semester.deletedAt,
        }
      : null;

    // V2 기반 사용자 타입 결정 (하위 호환성을 위해 V1 타입도 고려)
    // type이 "Student"인 경우 student table에서 해당 studentNumber이 있는지 확인 후 upsert
    // student_t에서 이번 학기의 해당 student_id이 있는지 확인 후 upsert
    if (
      typeV2 === "S" || // V2: 학생
      ((type === "Student" || type === "Ex-employee") &&
        !typeV2.startsWith("P")) // V1 fallback
    ) {
      context.stage = "db.student.validate";
      db.currentStudent = { ssoNumber: studentNumber };
      const studentNumberSuffix = getStudentNumberSuffix(studentNumber);

      //HP 학번(6900~6999)인 경우 로그인 불가
      if (studentNumberSuffix >= 6900) {
        if (studentNumberSuffix < 7000) {
          throw new HttpException(
            "HP 학번은 로그인할 수 없습니다.",
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (Number.isNaN(studentNumberSuffix)) {
        throw new HttpException(
          "학번 형식이 올바르지 않습니다.",
          HttpStatus.BAD_REQUEST,
        );
      }

      const studentNum = parseInt(studentNumber);

      context.stage = "db.student.upsert";
      await this.userSsoLoginRepository.ensureStudent({
        name,
        number: studentNum,
        userId: user.id,
        email,
      });

      context.stage = "db.student.read";
      db.currentStudentQueriedAt = this.clock.now();
      const student = await this.prisma.student
        .findMany({
          where: {
            number: studentNum,
            deletedAt: null,
          },
        })
        .then(takeOne);

      context.studentId = student?.id;
      db.currentStudent = student
        ? {
            id: student.id,
            number: student.number,
            ssoNumber: studentNumber,
            userId: student.userId,
            createdAt: student.createdAt,
            deletedAt: student.deletedAt,
          }
        : null;

      //v2info 기반 학적 상태 및 학위 구분
      let studentStatusEnum = 2;

      // 학적 상태 판별 (v2info)
      if (statusV2 === "재학") {
        studentStatusEnum = 1;
      }

      context.stage = "db.current-degree.read";
      const currentStudentTerms: Record<string, unknown> = {};
      db.currentStudentTerms = currentStudentTerms;
      const resolvingStudent = {
        id: student.id,
        number: studentNumber,
        source: "current",
        progCodeV2,
      };
      db.resolvingStudent = resolvingStudent;
      const existingStudentEnum = await this.getCurrentStudentEnumByStudentId(
        [student.id],
        currentStudentTerms,
      );
      context.stage = "db.current-degree.resolve";
      Object.assign(resolvingStudent, {
        hasExistingStudentEnum: existingStudentEnum.has(student.id),
        existingStudentEnum: existingStudentEnum.get(student.id),
      });
      const studentEnum = this.resolveStudentEnum({
        existingStudentEnum: existingStudentEnum.get(student.id),
        progCodeV2,
        studentNumber,
      });

      if (!progCodeV2) {
        if (studentEnum === 1) {
          studentStatusEnum = 1;
        }
      }

      // 부서 ID를 안전하게 정수로 변환 (NaN 방지)
      const departmentId =
        department && !Number.isNaN(parseInt(department))
          ? parseInt(department)
          : null;

      db.currentStudentResolution = {
        studentEnum,
        studentStatusEnum,
        departmentId,
        existingStudentEnum: existingStudentEnum.get(student.id),
      };
      context.stage = "db.student_t.write";
      await this.userSsoLoginRepository.ensureStudentTerm({
        studentId: student.id,
        studentEnum,
        studentStatusEnum,
        department: departmentId,
        semesterId: semester.id,
        startTerm: semester.startTerm,
        endTerm: semester.endTerm,
      });

      // student 테이블에서 해당 user id를 모두 검색
      // undergraduate, master, doctor 중 해당하는 경우 result에 추가
      context.stage = "db.linked-students.read";
      db.linkedStudentsQueriedAt = this.clock.now();
      const students = await this.prisma.student.findMany({
        where: { userId: user.id, deletedAt: null },
      });

      db.linkedStudents = students.map(studentRow => ({
        id: studentRow.id,
        number: studentRow.number,
        userId: studentRow.userId,
        createdAt: studentRow.createdAt,
        deletedAt: studentRow.deletedAt,
      }));
      context.stage = "db.linked-degree.read";
      const linkedStudentTerms: Record<string, unknown> = {};
      db.linkedStudentTerms = linkedStudentTerms;
      const studentEnumByStudentId =
        await this.getCurrentStudentEnumByStudentId(
          students.map(studentRow => studentRow.id),
          linkedStudentTerms,
        );

      // eslint-disable-next-line no-restricted-syntax
      for (const studentRow of students) {
        context.stage = "db.linked-degree.resolve";
        db.resolvingStudent = {
          id: studentRow.id,
          number: studentRow.number,
          source: "linked",
          progCodeV2: null,
          hasExistingStudentEnum: studentEnumByStudentId.has(studentRow.id),
          existingStudentEnum: studentEnumByStudentId.get(studentRow.id),
        };
        const resolvedStudentEnum = this.resolveStudentEnum({
          existingStudentEnum: studentEnumByStudentId.get(studentRow.id),
          progCodeV2: null,
          studentNumber: studentRow.number,
        });

        result = this.withStudentProfile(result, {
          id: studentRow.id,
          number: studentRow.number,
          studentEnum: resolvedStudentEnum,
        });
      }

      // type이 "Student"인 경우 executive table에서 해당 studentNumber이 있는지 확인
      // 있으면 해당 칼럼의 user_id를 업데이트
      context.stage = "db.executive.update";
      await this.userSsoLoginRepository.updateExecutiveUser(
        student.id,
        user.id,
      );

      context.stage = "db.executive.read";
      const executiveQueriedAt = this.clock.now();
      db.executiveQueriedAt = executiveQueriedAt;
      const executiveRows =
        await this.userSsoLoginRepository.findActiveExecutives(
          student.id,
          executiveQueriedAt,
        );

      db.executives = executiveRows;
      const executive = takeOne(executiveRows);
      if (executive) {
        result.executive = {
          id: executive.id,
          studentId: executive.studentId,
        };
      }
    }

    // V2 기반 교수 타입 결정 (P: Professor, PA: Professor Associate, F: Faculty)
    if (
      typeV2 === "P" ||
      typeV2 === "PA" || // V2: 부교수/겸임교수
      typeV2 === "F" || // V2: 교수/교직원
      type.includes("Teacher") ||
      typeV2.startsWith("P") // V1 fallback
    ) {
      context.stage = "db.professor.upsert";
      await this.userSsoLoginRepository.ensureProfessor({
        userId: user.id,
        name,
        email,
      });

      context.stage = "db.professor.read";
      db.professorQueriedAt = this.clock.now();
      const professor = await this.prisma.professor
        .findMany({
          where: { userId: user.id, deletedAt: null },
        })
        .then(takeOne);

      // 부서 ID를 안전하게 정수로 변환 (NaN 방지)
      const departmentId =
        department && !Number.isNaN(parseInt(department))
          ? parseInt(department)
          : null;

      db.professor = professor ? { id: professor.id } : null;
      context.stage = "db.professor.term-write";
      await this.userSsoLoginRepository.ensureProfessorTerm({
        department: departmentId,
        professorId: professor.id,
        startTerm: semester.startTerm,
      });

      result.professor = {
        id: professor.id,
      };
    }

    // V2 기반 직원 타입 결정 (E: Employee, R: Researcher)
    if (
      typeV2 === "E" ||
      typeV2 === "R" || // V2: 직원/연구원
      type === "Employee" // V1 fallback
    ) {
      context.stage = "db.employee.upsert";
      await this.userSsoLoginRepository.ensureEmployee({
        userId: user.id,
        name,
        email,
      });

      context.stage = "db.employee.read";
      db.employeeQueriedAt = this.clock.now();
      const employee = await this.prisma.employee
        .findMany({
          where: { userId: user.id, deletedAt: null },
        })
        .then(takeOne);

      db.employee = employee ? { id: employee.id } : null;
      context.stage = "db.employee.term-write";
      await this.userSsoLoginRepository.ensureEmployeeTerm({
        employeeId: employee.id,
        startTerm: semester.startTerm,
      });

      result.employee = {
        id: employee.id,
      };
    }

    return result;
  }

  async findUserById(id: number): Promise<{
    id: number;
    sid: string;
    name: string;
    email: string;
    undergraduate?: {
      id: number;
      number: number;
    };
    master?: {
      id: number;
      number: number;
    };
    doctor?: {
      id: number;
      number: number;
    };
    executive?: {
      id: number;
      studentId: number;
    };
    professor?: {
      id: number;
      email: string;
    };
    employee?: {
      id: number;
      email: string;
    };
  }> {
    const user = await this.prisma.user
      .findMany({
        where: { id, deletedAt: null },
      })
      .then(takeOne);

    const result: {
      id: number;
      sid: string;
      name: string;
      email: string;
      undergraduate?: {
        id: number;
        number: number;
      };
      master?: {
        id: number;
        number: number;
      };
      doctor?: {
        id: number;
        number: number;
      };
      executive?: {
        id: number;
        studentId: number;
      };
      professor?: {
        id: number;
        email: string;
      };
      employee?: {
        id: number;
        email: string;
      };
    } = {
      id: user.id,
      sid: user.sid,
      name: user.name,
      email: user.email,
    };

    const students = await this.prisma.student.findMany({
      where: { userId: id, deletedAt: null },
    });

    const studentEnumByStudentId = await this.getCurrentStudentEnumByStudentId(
      students.map(student => student.id),
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const student of students) {
      const resolvedStudentEnum = this.resolveStudentEnum({
        existingStudentEnum: studentEnumByStudentId.get(student.id),
        progCodeV2: null,
        studentNumber: student.number,
      });

      this.withStudentProfile(result, {
        id: student.id,
        number: student.number,
        studentEnum: resolvedStudentEnum,
      });
    }

    const executive = await this.prisma.executive
      .findMany({
        where: { userId: id, deletedAt: null },
      })
      .then(takeOne);

    if (executive) {
      result.executive = {
        id: executive.id,
        studentId: executive.studentId,
      };
    }

    const professor = await this.prisma.professor
      .findMany({
        where: { userId: id, deletedAt: null },
      })
      .then(takeOne);

    if (professor) {
      result.professor = {
        id: professor.id,
        email: professor.email,
      };
    }

    const employee = await this.prisma.employee
      .findMany({
        where: { userId: id, deletedAt: null },
      })
      .then(takeOne);

    if (employee) {
      result.employee = {
        id: employee.id,
        email: employee.email,
      };
    }

    return result;
  }

  private async getCurrentStudentEnumByStudentId(
    studentIds: number[],
    diagnostic?: Record<string, unknown>,
  ) {
    const queryDiagnostic = diagnostic ?? {};
    if (studentIds.length === 0) {
      queryDiagnostic.skipped = "no_student_ids";
      return new Map<number, number>();
    }

    const currentDate = this.clock.now();
    queryDiagnostic.queriedAt = currentDate;
    queryDiagnostic.studentIds = studentIds;
    queryDiagnostic.validityFilter =
      "startTerm <= queriedAt AND (endTerm IS NULL OR endTerm >= queriedAt) AND deletedAt IS NULL";
    queryDiagnostic.orderBy = ["startTerm DESC", "id DESC"];
    queryDiagnostic.selectedFields = ["studentId", "studentEnum"];
    const studentTerms = await this.prisma.studentT.findMany({
      where: {
        studentId: { in: studentIds },
        startTerm: { lte: currentDate },
        OR: [{ endTerm: null }, { endTerm: { gte: currentDate } }],
        deletedAt: null,
      },
      orderBy: [{ startTerm: "desc" }, { id: "desc" }],
      select: { studentId: true, studentEnum: true },
    });

    queryDiagnostic.rows = studentTerms;
    const studentEnumByStudentId = new Map<number, number>();

    // eslint-disable-next-line no-restricted-syntax
    for (const studentTerm of studentTerms) {
      if (!studentEnumByStudentId.has(studentTerm.studentId)) {
        studentEnumByStudentId.set(
          studentTerm.studentId,
          studentTerm.studentEnum,
        );
      }
    }

    return studentEnumByStudentId;
  }

  private resolveStudentEnum({
    existingStudentEnum,
    progCodeV2,
    studentNumber,
  }: {
    existingStudentEnum?: number;
    progCodeV2: string | null;
    studentNumber: string | number;
  }) {
    const ssoStudentEnum = this.getStudentEnumFromProgCodeV2(progCodeV2);
    if (ssoStudentEnum !== undefined) {
      return ssoStudentEnum;
    }

    if (existingStudentEnum !== undefined) {
      return existingStudentEnum;
    }

    return this.getFallbackStudentEnumFromStudentNumber(studentNumber);
  }

  private getStudentEnumFromProgCodeV2(progCodeV2: string | null) {
    if (progCodeV2 === "0") {
      return 1;
    }

    if (progCodeV2 === "1") {
      return 2;
    }

    if (progCodeV2 === "2") {
      return 3;
    }

    return undefined;
  }

  private getFallbackStudentEnumFromStudentNumber(
    studentNumber: string | number,
  ) {
    const suffix = getStudentNumberSuffix(studentNumber);

    if (Number.isNaN(suffix)) {
      throw new HttpException(
        "학번 형식이 올바르지 않습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (suffix < 2000) {
      return 1;
    }

    if (suffix < 5000) {
      return 2;
    }

    if (suffix < 6000) {
      return 3;
    }

    throw new HttpException(
      FALLBACK_STUDENT_ENUM_ERROR_MESSAGE,
      HttpStatus.BAD_REQUEST,
    );
  }

  private withStudentProfile<T extends StudentProfile>(
    result: T,
    student: { id: number; number: number; studentEnum: number },
  ) {
    const profileKey = studentProfileKeyByEnum.get(student.studentEnum);
    if (profileKey === undefined) {
      return result;
    }

    return Object.assign(result, {
      [profileKey]: { id: student.id, number: student.number },
    });
  }

  async findUserAndRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    const cur = this.clock.now();
    const result = await this.prisma.$queryRaw<Array<{ id: number }>>(
      Prisma.sql`
        SELECT u.id
        FROM user u
        INNER JOIN auth_activated_refresh_tokens art
          ON u.id = art.user_id
          AND art.refresh_token = ${refreshToken}
          AND art.expires_at >= ${cur}
        WHERE u.id = ${userId}
          AND u.deleted_at IS NULL
      `,
    );
    return result.length > 0;
  }

  async createRefreshTokenRecord(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<boolean> {
    await this.authExchangeLoginRepository.storeRefreshToken({
      userId,
      refreshToken,
      expiresAt,
    });
    return true;
  }

  async deleteRefreshTokenRecord(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    await this.authExchangeLoginRepository.deleteRefreshToken(
      userId,
      refreshToken,
      this.clock.now(),
    );
    return true;
  }
}
