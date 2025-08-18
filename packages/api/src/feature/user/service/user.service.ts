import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { formatInTimeZone } from "date-fns-tz";

import { ApiUsr002ResponseOk } from "@clubs/interface/api/user/endpoint/apiUsr002";
import { ApiUsr006RequestBody } from "@clubs/interface/api/user/endpoint/apiUsr006";

import ClubStudentTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-student-t.repository";
import UserRepository from "@sparcs-clubs/api/feature/user/repository/user.repository";

import ExecutiveRepository from "../repository/executive.repository";
import OldProfessorRepository from "../repository/old.professor.repository";
import OldStudentRepository from "../repository/old.student.repository";
import { StudentRepository } from "../repository/student.repository";

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly oldStudentRepository: OldStudentRepository,
    private readonly executiveRepository: ExecutiveRepository,
    private readonly professorRepository: OldProfessorRepository,
    private readonly clubStudentTRepository: ClubStudentTRepository,
    private readonly studentRepository: StudentRepository,
  ) {}

  async getStudentUserMy(studentId: number) {
    const user = await this.userRepository.findStudentById(studentId);
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    const { id, name, email, department, studentNumber, phoneNumber } = user[0];
    const clubs =
      await this.clubStudentTRepository.getClubsByStudentId(studentId);
    const userData = {
      id,
      name,
      email,
      department: department || "학과 정보 없음",
      studentNumber,
      phoneNumber: phoneNumber || "",
      clubs,
    };

    return userData;
  }

  async findStudentById(query: number) {
    const student = await this.userRepository.create(query);
    if (!student) {
      throw new HttpException("Student Doesn't exist", HttpStatus.NOT_FOUND);
    }
    return student;
  }

  async getUserPhoneNumber(userId: number): Promise<ApiUsr002ResponseOk> {
    const phoneNumber = await this.userRepository.getPhoneNumber(userId);
    return phoneNumber;
  }

  async getStudentPhoneNumberByUserId(
    userId: number,
  ): Promise<ApiUsr002ResponseOk> {
    const phoneNumber =
      await this.oldStudentRepository.getStudentPhoneNumber(userId);
    return phoneNumber;
  }

  async getExecutivePhoneNumberByUserId(
    userId: number,
  ): Promise<ApiUsr002ResponseOk> {
    const phoneNumber =
      await this.executiveRepository.getExecutivePhoneNumber(userId);
    return phoneNumber;
  }

  async getProfessorPhoneNumberByUserId(
    userId: number,
  ): Promise<ApiUsr002ResponseOk> {
    const phoneNumber =
      await this.professorRepository.getProfessorPhoneNumber(userId);
    return phoneNumber;
  }

  async updatePhoneNumber(userId: number, phoneNumber: string) {
    await this.userRepository.updatePhoneNumber(userId, phoneNumber);
  }

  async updateExecutivePhoneNumber(userId: number, phoneNumber: string) {
    await this.executiveRepository.updateExecutivePhoneNumber(
      userId,
      phoneNumber,
    );
  }

  async updateProfessorPhoneNumber(userId: number, phoneNumber: string) {
    await this.professorRepository.updateProfessorPhoneNumber(
      userId,
      phoneNumber,
    );
  }

  //todo: 트랜잭션으로 전부 묶어야 함.
  async createExecutive(userId: number, body: ApiUsr006RequestBody) {
    if (!(await this.executiveRepository.findExecutiveByUserId(userId))) {
      throw new HttpException("권한이 없습니다.", HttpStatus.FORBIDDEN);
    }
    const startTermStr = formatInTimeZone(
      body.startTerm,
      "Asia/Seoul",
      "yyyy-MM-dd",
    );
    // let endTermStr: string | null = null;
    // if (body.endTerm) {
    const endTermStr = formatInTimeZone(
      body.endTerm,
      "Asia/Seoul",
      "yyyy-MM-dd",
    );
    if (startTermStr >= endTermStr) {
      throw new HttpException(
        "시작날짜는 종료날짜보다 이전이어야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }
    // }
    const studentRaw =
      await this.userRepository.findStudentByStudentNumberNameDate(
        body.studentNumber,
        body.name,
        startTermStr,
        endTermStr,
      );
    const student =
      Array.isArray(studentRaw) && studentRaw.length === 1
        ? studentRaw[0]
        : null;
    if (!student) {
      throw new HttpException("잘못된 입력입니다.", HttpStatus.BAD_REQUEST);
    }
    if (
      await this.executiveRepository.checkExistExecutiveByIdDate(
        student.student.id,
        startTermStr,
        endTermStr,
      )
    ) {
      throw new HttpException(
        "이미 존재하는 집행부원입니다.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !(await this.executiveRepository.createExecutive(
        student.student.id,
        student.student.userId,
        student.student.email,
        body.name,
        startTermStr,
        endTermStr,
      ))
    ) {
      throw new HttpException(
        "Failed to create executive",
        HttpStatus.BAD_REQUEST,
      );
    }
    return {};
  }

  async getExecutives(userId: number) {
    if (!(await this.executiveRepository.findExecutiveByUserId(userId))) {
      throw new HttpException("권한이 없습니다.", HttpStatus.FORBIDDEN);
    }
    const executives = await this.executiveRepository.getExecutives();
    return executives.map(executive => ({
      ...executive,
      studentNumber: String(executive.studentNumber),
    }));
  }

  async deleteExecutive(userId: number, executiveId: number) {
    if (!(await this.executiveRepository.findExecutiveByUserId(userId))) {
      throw new HttpException("권한이 없습니다.", HttpStatus.FORBIDDEN);
    }
    const executive = await this.executiveRepository.selectExecutiveById({
      id: executiveId,
    });
    if (executive.length === 0) {
      throw new HttpException("Executive not found", HttpStatus.NOT_FOUND);
    }
    if (!(await this.executiveRepository.deleteExecutiveById(executiveId))) {
      throw new HttpException(
        "Failed to delete executive",
        HttpStatus.BAD_REQUEST,
      );
    }
    return {};
  }
}
