import { Module } from "@nestjs/common";

import ClubStudentTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-student-t.repository";
import UserRepository from "@sparcs-clubs/api/feature/user/repository/user.repository";

import { UserController } from "./controller/user.controller";
import PrivacyPolicyModule from "./privacy-policy/privacy-policy.module";
import {
  ExchangeLoginEmployeeIdentityRepository,
  ExchangeLoginExecutiveIdentityRepository,
  ExchangeLoginProfessorIdentityRepository,
  ExchangeLoginStudentIdentityRepository,
  ExchangeLoginUserIdentityRepository,
} from "./repository/exchange-login-identity.repository";
import { ExchangeLoginUserRepository } from "./repository/exchange-login-user.repository";
import ExecutiveRepository from "./repository/executive.repository";
import { UserLoginIdentityRepository } from "./repository/login-identity/user-login-identity.repository";
import OldProfessorRepository from "./repository/old.professor.repository";
import OldStudentRepository from "./repository/old.student.repository";
import { ProfessorRepository } from "./repository/professor.repository";
import { StudentRepository } from "./repository/student.repository";
import UserPublicService from "./service/user.public.service";
import { UserService } from "./service/user.service";
import { UserLoginIdentityService } from "./service/user-login-identity.service";

@Module({
  imports: [PrivacyPolicyModule],
  controllers: [UserController],
  providers: [
    UserPublicService,
    UserLoginIdentityService,
    UserLoginIdentityRepository,
    UserService,
    UserRepository,
    OldStudentRepository,
    ClubStudentTRepository,
    ExecutiveRepository,
    OldProfessorRepository,
    StudentRepository,
    ProfessorRepository,
    ExchangeLoginUserRepository,
    ExchangeLoginUserIdentityRepository,
    ExchangeLoginStudentIdentityRepository,
    ExchangeLoginProfessorIdentityRepository,
    ExchangeLoginEmployeeIdentityRepository,
    ExchangeLoginExecutiveIdentityRepository,
  ],
  exports: [UserPublicService],
})
export default class UserModule {}
