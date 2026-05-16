import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ApiUsr002ResponseOk } from "@clubs/interface/api/user/endpoint/apiUsr002";
import { ApiUsr006RequestBody } from "@clubs/interface/api/user/endpoint/apiUsr006";
import {
  ApiUsr009RequestBody,
  ApiUsr009RequestParam,
} from "@clubs/interface/api/user/endpoint/apiUsr009";

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

    const studentNumber = body.studentNumber.trim();
    const name = body.name.trim();

    if (!/^\d+$/.test(studentNumber)) {
      throw new HttpException(
        "학번은 숫자만 입력해주세요.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const studentByNumber =
      await this.userRepository.findStudentByStudentNumber(studentNumber);
    if (!studentByNumber) {
      throw new HttpException(
        "해당 학번의 학생을 찾을 수 없습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (studentByNumber.name !== name) {
      throw new HttpException(
        "학번과 이름이 일치하지 않습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const studentRaw =
      await this.userRepository.findStudentByStudentNumberNameDate(
        studentNumber,
        name,
        body.startTerm,
        null,
      );
    const student =
      Array.isArray(studentRaw) && studentRaw.length === 1
        ? studentRaw[0]
        : null;
    if (!student) {
      throw new HttpException(
        "집행부원 시작일이 해당 학생의 학적 기간과 겹치지 않습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      await this.executiveRepository.checkExistExecutiveByIdDate(
        student.student.id,
        body.startTerm,
        null,
      )
    ) {
      throw new HttpException(
        "해당 기간에 이미 집행부원 임기가 존재합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !(await this.executiveRepository.createExecutive(
        student.student.id,
        student.student.userId,
        student.student.email,
        name,
        body.startTerm,
        null,
      ))
    ) {
      throw new HttpException(
        "Failed to create executive",
        HttpStatus.BAD_REQUEST,
      );
    }
    return {};
  }

  async updateExecutiveTerm(
    userId: number,
    param: ApiUsr009RequestParam,
    body: ApiUsr009RequestBody,
  ) {
    if (!(await this.executiveRepository.findExecutiveByUserId(userId))) {
      throw new HttpException("권한이 없습니다.", HttpStatus.FORBIDDEN);
    }

    if (body.endTerm !== null && body.startTerm >= body.endTerm) {
      throw new HttpException(
        "시작날짜는 종료날짜보다 이전이어야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const executiveTerm =
      await this.executiveRepository.selectExecutiveTermById(
        param.executiveTId,
      );
    if (!executiveTerm) {
      throw new HttpException(
        "집행부원 임기를 찾을 수 없습니다.",
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      await this.executiveRepository.checkExistExecutiveByIdDate(
        executiveTerm.executive.studentId,
        body.startTerm,
        body.endTerm,
        param.executiveTId,
      )
    ) {
      throw new HttpException(
        "수정하려는 기간이 같은 학생의 다른 집행부원 임기와 겹칩니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !(await this.executiveRepository.updateExecutiveTerm(
        param.executiveTId,
        body.startTerm,
        body.endTerm,
      ))
    ) {
      throw new HttpException(
        "Failed to update executive term",
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
