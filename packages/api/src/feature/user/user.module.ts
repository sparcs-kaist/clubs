import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import ClubStudentTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-student-t.repository";
import UserRepository from "@sparcs-clubs/api/feature/user/repository/user.repository";

import { UserController } from "./controller/user.controller";
import PrivacyPolicyModule from "./privacy-policy/privacy-policy.module";
import ExecutiveRepository from "./repository/executive.repository";
import ProfessorRepository from "./repository/professor.repository";
import StudentRepository from "./repository/student.repository";
import UserPublicService from "./service/user.public.service";
import { UserService } from "./service/user.service";

@Module({
  imports: [DrizzleModule, PrivacyPolicyModule],
  controllers: [UserController],
  providers: [
    UserPublicService,
    UserService,
    UserRepository,
    StudentRepository,
    ClubStudentTRepository,
    ExecutiveRepository,
    ProfessorRepository,
  ],
  exports: [
    UserPublicService,
    UserService,
    UserRepository,
    ExecutiveRepository,
  ],
})
export default class UserModule {}
