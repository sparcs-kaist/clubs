import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ApiUsr002ResponseOk } from "@clubs/interface/api/user/endpoint/apiUsr002";

import ClubStudentTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-student-t.repository";
import UserRepository from "@sparcs-clubs/api/feature/user/repository/user.repository";

import ExecutiveRepository from "../repository/executive.repository";
import ProfessorRepository from "../repository/professor.repository";
import StudentRepository from "../repository/student.repository";

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly studentRepository: StudentRepository,
    private readonly executiveRepository: ExecutiveRepository,
    private readonly professorRepository: ProfessorRepository,
    private readonly clubStudentTRepository: ClubStudentTRepository,
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
      await this.studentRepository.getStudentPhoneNumber(userId);
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
}
