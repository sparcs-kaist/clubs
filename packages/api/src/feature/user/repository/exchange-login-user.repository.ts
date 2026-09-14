import { Injectable } from "@nestjs/common";

import {
  ApiAut005RequestQuery,
  ApiAut005ResponseOk,
} from "@clubs/interface/api/auth/endpoint/apiAut005";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";

import {
  ExchangeLoginEmployeeIdentityRepository,
  ExchangeLoginExecutiveIdentityRepository,
  ExchangeLoginProfessorIdentityRepository,
  ExchangeLoginStudentIdentityRepository,
  ExchangeLoginUserIdentityRepository,
} from "./exchange-login-identity.repository";

@Injectable()
export class ExchangeLoginUserRepository {
  constructor(
    private readonly users: ExchangeLoginUserIdentityRepository,
    private readonly students: ExchangeLoginStudentIdentityRepository,
    private readonly professors: ExchangeLoginProfessorIdentityRepository,
    private readonly employees: ExchangeLoginEmployeeIdentityRepository,
    private readonly executives: ExchangeLoginExecutiveIdentityRepository,
  ) {}

  async getExchangeLoginUserById(userId: number) {
    const [user] = await this.users.find({ id: userId });
    if (!user) return null;
    return {
      id: user.id,
      sid: user.sid ?? null,
      name: user.name,
      email: user.email,
    };
  }

  async searchExchangeLoginUsers(
    query: ApiAut005RequestQuery,
  ): Promise<ApiAut005ResponseOk["users"]> {
    const userIds = [...new Set(await this.findMatchingUserIds(query))];
    if (userIds.length === 0) return [];

    const [users, students, professors] = await Promise.all([
      this.users.find({ id: userIds, orderBy: { id: OrderByTypeEnum.ASC } }),
      this.students.find({
        userId: userIds,
        orderBy: { id: OrderByTypeEnum.ASC },
      }),
      this.professors.find({
        userId: userIds,
        orderBy: { id: OrderByTypeEnum.ASC },
      }),
    ]);

    return users.map(user => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      students: students
        .filter(student => student.userId === user.id)
        .map(student => ({
          studentId: student.id,
          studentNumber: student.number!,
        })),
      professors: professors
        .filter(professor => professor.userId === user.id)
        .map(professor => ({ professorId: professor.id })),
    }));
  }

  private async findMatchingUserIds(query: ApiAut005RequestQuery) {
    if (query.type === "email") {
      const [users, ...profiles] = await Promise.all([
        this.users.find({ email: query.value }),
        this.students.find({ email: query.value }),
        this.professors.find({ email: query.value }),
        this.employees.find({ email: query.value }),
        this.executives.find({ email: query.value }),
      ]);
      return [
        ...users.map(user => user.id),
        ...profiles
          .flat()
          .flatMap(profile => (profile.userId == null ? [] : [profile.userId])),
      ];
    }

    const value = Number(query.value);
    const profiles =
      query.type === "professorId"
        ? await this.professors.find({ id: value })
        : await this.students.find({
            [query.type === "studentId" ? "id" : "number"]: value,
          });
    return profiles.flatMap(profile =>
      profile.userId == null ? [] : [profile.userId],
    );
  }
}
