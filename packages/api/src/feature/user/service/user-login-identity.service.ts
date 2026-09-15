import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";

import { StudentEnum } from "@clubs/interface/common/enum/user.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { takeOne } from "@sparcs-clubs/api/common/util/util";

import {
  IdentitySyncDiagnostic,
  LoginIdentity,
  LoginSemester,
  SsoIdentityInput,
  UserIdentitySyncError,
} from "../model/login-identity";
import { UserLoginIdentityRepository } from "../repository/login-identity/user-login-identity.repository";
import {
  isEmployeeIdentity,
  isProfessorIdentity,
  isStudentIdentity,
  parseIdentityDepartment,
} from "./login-identity-policy";

type StudentProfile = Pick<
  LoginIdentity,
  | "undergraduate"
  | "master"
  | "doctor"
  | "masterDoctorDoctor"
  | "masterDoctorMaster"
  | "allPrograms"
  | "auditor"
>;

type StudentProfileKey = keyof StudentProfile;

const studentProfileKeyByEnum = new Map<number, StudentProfileKey>([
  [StudentEnum.Undergraduate, "undergraduate"],
  [StudentEnum.Master, "master"],
  [StudentEnum.Doctor, "doctor"],
  [StudentEnum.MasterDoctorDoctor, "masterDoctorDoctor"],
  [StudentEnum.MasterDoctorMaster, "masterDoctorMaster"],
  [StudentEnum.AllPrograms, "allPrograms"],
  [StudentEnum.Auditor, "auditor"],
]);

const getStudentNumberSuffix = (studentNumber: string | number) =>
  Number(studentNumber.toString().slice(-4));

const FALLBACK_STUDENT_ENUM_ERROR_MESSAGE =
  "교환학생의 학적 정보를 추적할 수 없습니다. 관리자에게 문의해주세요.";

@Injectable()
export class UserLoginIdentityService {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private readonly identityRepository: UserLoginIdentityRepository,
  ) {}

  @Transactional()
  async syncSsoIdentity(
    input: SsoIdentityInput,
    semester: LoginSemester,
  ): Promise<{ identity: LoginIdentity; diagnostic: IdentitySyncDiagnostic }> {
    const {
      email,
      studentNumber,
      sid,
      name,
      type,
      department,
      typeV2,
      statusV2,
      progCodeV2,
    } = input;
    const context: IdentitySyncDiagnostic = { stage: "db.user.upsert" };
    const db = context.db ?? {};
    context.db = db;
    try {
      context.stage = "db.user.upsert";
      await this.identityRepository.ensureUser({ sid, name, email });

      context.stage = "db.user.read";
      db.userQueriedAt = this.clock.now();
      const user = await this.identityRepository.findUserByEmail(email);

      db.user = user ? { id: user.id, deletedAt: user.deletedAt } : null;
      context.userId = user?.id;

      let result: LoginIdentity = {
        id: user.id,
        sid: user.sid,
        name: user.name,
        email: user.email,
      };

      // V2 기반 사용자 타입 결정 (하위 호환성을 위해 V1 타입도 고려)
      // type이 "Student"인 경우 student table에서 해당 studentNumber이 있는지 확인 후 upsert
      // student_t에서 이번 학기의 해당 student_id이 있는지 확인 후 upsert
      if (isStudentIdentity(type, typeV2)) {
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
        await this.identityRepository.ensureStudent({
          name,
          number: studentNum,
          userId: user.id,
          email,
        });

        context.stage = "db.student.read";
        db.currentStudentQueriedAt = this.clock.now();
        const student =
          await this.identityRepository.findStudentByNumber(studentNum);

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
          if (studentEnum === StudentEnum.Undergraduate) {
            studentStatusEnum = 1;
          }
        }

        // 부서 ID를 안전하게 정수로 변환 (NaN 방지)
        const departmentId = parseIdentityDepartment(department);

        db.currentStudentResolution = {
          studentEnum,
          studentStatusEnum,
          departmentId,
          existingStudentEnum: existingStudentEnum.get(student.id),
        };
        context.stage = "db.student_t.write";
        await this.identityRepository.ensureStudentTerm({
          studentId: student.id,
          studentEnum,
          studentStatusEnum,
          department: departmentId,
          semesterId: semester.id,
          startTerm: semester.startTerm,
          endTerm: semester.endTerm,
        });

        // student 테이블에서 해당 user id를 모두 검색
        // 현재 학위에 해당하는 profile을 result에 추가
        context.stage = "db.linked-students.read";
        db.linkedStudentsQueriedAt = this.clock.now();
        const students = await this.identityRepository.findStudentsByUserId(
          user.id,
        );

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
        await this.identityRepository.updateExecutiveUser(student.id, user.id);

        context.stage = "db.executive.read";
        const executiveQueriedAt = this.clock.now();
        db.executiveQueriedAt = executiveQueriedAt;
        const executiveRows =
          await this.identityRepository.findActiveExecutives(
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
      if (isProfessorIdentity(type, typeV2)) {
        context.stage = "db.professor.upsert";
        await this.identityRepository.ensureProfessor({
          userId: user.id,
          name,
          email,
        });

        context.stage = "db.professor.read";
        db.professorQueriedAt = this.clock.now();
        const professor = await this.identityRepository.findProfessorByUserId(
          user.id,
        );

        // 부서 ID를 안전하게 정수로 변환 (NaN 방지)
        const departmentId = parseIdentityDepartment(department);

        db.professor = professor ? { id: professor.id } : null;
        context.stage = "db.professor.term-write";
        await this.identityRepository.ensureProfessorTerm({
          department: departmentId,
          professorId: professor.id,
          startTerm: semester.startTerm,
        });

        result.professor = {
          id: professor.id,
        };
      }

      // V2 기반 직원 타입 결정 (E: Employee, R: Researcher)
      if (isEmployeeIdentity(type, typeV2)) {
        context.stage = "db.employee.upsert";
        await this.identityRepository.ensureEmployee({
          userId: user.id,
          name,
          email,
        });

        context.stage = "db.employee.read";
        db.employeeQueriedAt = this.clock.now();
        const employee = await this.identityRepository.findEmployeeByUserId(
          user.id,
        );

        db.employee = employee ? { id: employee.id } : null;
        context.stage = "db.employee.term-write";
        await this.identityRepository.ensureEmployeeTerm({
          employeeId: employee.id,
          startTerm: semester.startTerm,
        });

        result.employee = {
          id: employee.id,
        };
      }

      return { identity: result, diagnostic: context };
    } catch (error) {
      throw new UserIdentitySyncError(error, context);
    }
  }

  async findLoginIdentity(id: number): Promise<LoginIdentity> {
    const user = await this.identityRepository.findUserById(id);

    const result: LoginIdentity = {
      id: user.id,
      sid: user.sid,
      name: user.name,
      email: user.email,
    };

    const students = await this.identityRepository.findStudentsByUserId(id);

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

    const executive = await this.identityRepository.findExecutiveByUserId(id);

    if (executive) {
      result.executive = {
        id: executive.id,
        studentId: executive.studentId,
      };
    }

    const professor = await this.identityRepository.findProfessorByUserId(id);

    if (professor) {
      result.professor = {
        id: professor.id,
        email: professor.email,
      };
    }

    const employee = await this.identityRepository.findEmployeeByUserId(id);

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
    const studentTerms = await this.identityRepository.findCurrentStudentTerms(
      studentIds,
      currentDate,
    );

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

  private getStudentEnumFromProgCodeV2(
    progCodeV2: string | null,
  ): StudentEnum | undefined {
    switch (progCodeV2) {
      case "0":
        return StudentEnum.Undergraduate;
      case "1":
      case "3":
      case "4":
        return StudentEnum.Master;
      case "5":
        return StudentEnum.Doctor;
      case "7":
        return StudentEnum.MasterDoctorDoctor;
      case "8":
        return StudentEnum.MasterDoctorMaster;
      case "9":
        return StudentEnum.AllPrograms;
      case "10":
        return StudentEnum.Auditor;
      default:
        return undefined;
    }
  }

  private getFallbackStudentEnumFromStudentNumber(
    studentNumber: string | number,
  ): StudentEnum {
    const suffix = getStudentNumberSuffix(studentNumber);

    if (Number.isNaN(suffix)) {
      throw new HttpException(
        "학번 형식이 올바르지 않습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (suffix < 2000) {
      return StudentEnum.Undergraduate;
    }

    if (suffix < 5000) {
      return StudentEnum.Master;
    }

    if (suffix < 6000) {
      return StudentEnum.Doctor;
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

  async isActiveUser(userId: number): Promise<boolean> {
    return (await this.identityRepository.findUserById(userId)) !== null;
  }
}
