import { Inject, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { Prisma } from "@prisma/client";

import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { withDeleted } from "@sparcs-clubs/api/common/util/soft-delete";
import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { syncDelegateMemberRegistrations } from "@sparcs-clubs/api/feature/registration/util/sync-delegate-member-registrations";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { lockClubDelegates } from "../repository/lock-club-delegates";
import { pendingDelegateChangeWhere } from "./delegate-change-policy";

function currentRoleClubName(
  club: { nameKr: string | null; nameEn: string | null },
  clubId: number,
) {
  const nameKr = club.nameKr?.trim();
  if (nameKr) return nameKr;
  const nameEn = club.nameEn?.trim();
  if (nameEn) return nameEn;
  return `동아리 #${clubId}`;
}

@Injectable()
export class ClubDelegateDRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private readonly prisma: PrismaService,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  lockChanges(clubId: number, studentId?: number) {
    return lockClubDelegates(this.txHost, clubId, studentId);
  }

  findRequestById(id: number) {
    return this.txHost.tx.clubDelegateChangeRequest.findUnique({
      where: withDeleted({ id }),
    });
  }

  findClubRequests(clubId: number, now: Date) {
    return this.txHost.tx.clubDelegateChangeRequest.findMany({
      where: {
        clubId,
        deletedAt: null,
        OR: [
          {
            clubDelegateChangeRequestStatusEnumId: {
              not: ClubDelegateChangeRequestStatusEnum.Applied,
            },
          },
          pendingDelegateChangeWhere(now),
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  findReceivedRequests(studentId: number, now: Date) {
    return this.txHost.tx.clubDelegateChangeRequest.findMany({
      where: { studentId, deletedAt: null, ...pendingDelegateChangeWhere(now) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        club: { select: { nameKr: true } },
      },
    });
  }

  findConflictingRequest(
    clubId: number,
    clubDelegateEnumId: ClubDelegateEnum,
    studentId: number,
    now: Date,
  ) {
    return this.txHost.tx.clubDelegateChangeRequest.findFirst({
      where: {
        deletedAt: null,
        ...pendingDelegateChangeWhere(now),
        OR: [{ clubId, clubDelegateEnumId }, { studentId }],
      },
      select: { id: true },
    });
  }

  createRequest(
    data: Pick<
      Prisma.ClubDelegateChangeRequestUncheckedCreateInput,
      | "clubId"
      | "clubDelegateEnumId"
      | "prevStudentId"
      | "studentId"
      | "createdAt"
    >,
  ) {
    return this.txHost.tx.clubDelegateChangeRequest.create({
      data: {
        ...data,
        clubDelegateChangeRequestStatusEnumId:
          ClubDelegateChangeRequestStatusEnum.Applied,
      },
    });
  }

  finishRequest(
    id: number,
    status: ClubDelegateChangeRequestStatusEnum,
    now: Date,
  ) {
    return this.txHost.tx.clubDelegateChangeRequest.updateMany({
      where: { id, deletedAt: null, ...pendingDelegateChangeWhere(now) },
      data: { clubDelegateChangeRequestStatusEnumId: status },
    });
  }

  cancelPendingRequests(
    where: Pick<
      Prisma.ClubDelegateChangeRequestWhereInput,
      "id" | "clubId" | "clubDelegateEnumId"
    >,
    now: Date,
  ) {
    return this.txHost.tx.clubDelegateChangeRequest.updateMany({
      where: { ...where, deletedAt: null, ...pendingDelegateChangeWhere(now) },
      data: { deletedAt: now },
    });
  }

  findCandidateMembership(
    studentId: number,
    clubId: number,
    semesterId: number,
  ) {
    return this.txHost.tx.clubStudentT.findFirst({
      where: { studentId, clubId, semesterId, deletedAt: null },
      select: { id: true },
    });
  }

  // 가장 최근 대표자의 이름을 가져오기
  async findRepresentativeName(
    clubId: number,
    startTerm?: Date,
  ): Promise<{ name: string }> {
    const query = startTerm
      ? Prisma.sql`
          SELECT s.name
          FROM club_delegate_d cd
          LEFT JOIN student s ON s.id = cd.student_id
          WHERE cd.club_id = ${clubId}
            AND cd.club_delegate_enum_id = 1
            AND cd.start_term <= ${startTerm}
            AND (cd.end_term >= ${startTerm} OR cd.end_term IS NULL)
          ORDER BY cd.end_term
          LIMIT 1
        `
      : Prisma.sql`
          SELECT s.name
          FROM club_delegate_d cd
          LEFT JOIN student s ON s.id = cd.student_id
          WHERE cd.club_id = ${clubId}
            AND cd.club_delegate_enum_id = 1
            AND cd.start_term <= NOW()
            AND (cd.end_term >= NOW() OR cd.end_term IS NULL)
          ORDER BY cd.end_term
          LIMIT 1
        `;

    const result = await this.prisma.$queryRaw<Array<{ name: string }>>(query);

    return takeOne(result);
  }

  /**
   * @param clubId 동아리 id
   * @returns 해당 동아리의 대표자 id 목록을 가져옵니다.
   */
  async findRepresentativeIdListByClubId(
    clubId: number,
  ): Promise<Array<{ studentId: number }>> {
    const result = await this.findDelegateByClubId(clubId);

    return result.map(e => ({ studentId: e.studentId }));
  }

  /**
   * @param clubId 동아리 id
   * @returns 해당 동아리의 대표자 정보 목록을 가져옵니다.
   */
  async findDelegateByClubId(clubId: number, currentDate = this.clock.now()) {
    const delegate = await this.txHost.tx.clubDelegateD.findMany({
      where: {
        clubId,
        startTerm: { lte: currentDate },
        OR: [{ endTerm: { gt: currentDate } }, { endTerm: null }],
        deletedAt: null,
      },
      orderBy: { endTerm: "asc" },
    });

    return delegate;
  }

  /**
   * @param studentId 학생 id
   * @returns 해당 학생이 대표자 정보를 목록을 가져옵니다.
   * 로직에 문제가 없을경우 크기가 0 또는 1인 리스트가 리턴됩니다.
   */
  async findDelegateByStudentId(
    studentId: number,
    currentDate = this.clock.now(),
  ) {
    const delegate = await this.txHost.tx.clubDelegateD.findMany({
      where: {
        studentId,
        startTerm: { lte: currentDate },
        OR: [{ endTerm: { gt: currentDate } }, { endTerm: null }],
        deletedAt: null,
      },
      orderBy: { endTerm: "asc" },
    });

    return delegate;
  }

  async findRepresentativeByClubIdAndStudentId(
    studentId: number,
    clubId: number,
  ): Promise<boolean> {
    const crt = this.clock.now();
    const result = await this.prisma.clubDelegateD.findFirst({
      where: {
        clubId,
        studentId,
        startTerm: { lte: crt },
        OR: [{ endTerm: { gt: crt } }, { endTerm: null }],
        deletedAt: null,
      },
      select: { id: true },
    });
    return !!result;
  }

  async findDelegateCandidates(param: { clubId: number; semesterId: number }) {
    const now = this.clock.now();
    const { clubId, semesterId } = param;
    const { tx } = this.txHost;
    const memberships = await tx.clubStudentT.findMany({
      where: { clubId, semesterId, deletedAt: null, club: { deletedAt: null } },
      distinct: ["studentId"],
      select: { studentId: true },
    });
    const studentIds = memberships.map(({ studentId }) => studentId);
    const roles = await tx.clubDelegateD.findMany({
      where: {
        studentId: { in: studentIds },
        startTerm: { lte: now },
        deletedAt: null,
        OR: [{ endTerm: { gt: now } }, { endTerm: null }],
      },
      select: {
        studentId: true,
        clubId: true,
        clubDelegateEnum: true,
        club: { select: { nameKr: true, nameEn: true } },
      },
    });
    const rolesByStudentId = new Map<
      number,
      { clubId: number; clubName: string; delegateEnumId: ClubDelegateEnum }[]
    >();
    roles.forEach(role => {
      const currentRoles = rolesByStudentId.get(role.studentId) ?? [];
      currentRoles.push({
        clubId: role.clubId,
        clubName: currentRoleClubName(role.club, role.clubId),
        delegateEnumId: role.clubDelegateEnum as ClubDelegateEnum,
      });
      rolesByStudentId.set(role.studentId, currentRoles);
    });
    return memberships.map(({ studentId }) => ({
      studentId,
      currentRoles: rolesByStudentId.get(studentId) ?? [],
    }));
  }

  async updateDelegate(param: {
    clubId: number;
    clubDelegateEnumId: ClubDelegateEnum;
    studentId: number;
    now: Date;
    semesterId?: number;
  }): Promise<void> {
    const { tx } = this.txHost;
    const { clubId, clubDelegateEnumId, studentId, now, semesterId } = param;
    await tx.clubDelegateD.updateMany({
      where: {
        clubId,
        startTerm: { lte: now },
        deletedAt: null,
        AND: [
          { OR: [{ endTerm: { gt: now } }, { endTerm: null }] },
          { OR: [{ clubDelegateEnum: clubDelegateEnumId }, { studentId }] },
        ],
      },
      data: { endTerm: now },
    });

    if (studentId === 0) return;

    await tx.clubDelegateD.create({
      data: {
        clubId,
        studentId,
        clubDelegateEnum: clubDelegateEnumId,
        startTerm: now,
      },
    });

    if (semesterId === undefined) return;

    const clubT = await tx.clubT.findFirst({
      where: { clubId, semesterId, deletedAt: null },
      select: { startTerm: true, endTerm: true },
    });
    if (!clubT) return;

    await syncDelegateMemberRegistrations({
      tx,
      clubId,
      semesterId,
      startTerm: clubT.startTerm,
      endTerm: clubT.endTerm,
      studentIds: [studentId],
    });
  }

  async isPresidentByStudentIdAndClubId(studentId: number, clubId: number) {
    const cur = this.clock.now();
    const presidentEnumId = ClubDelegateEnum.Representative;
    const president = await this.prisma.clubDelegateD.count({
      where: {
        studentId,
        clubId,
        clubDelegateEnum: presidentEnumId,
        startTerm: { lte: cur },
        OR: [{ endTerm: { gt: cur } }, { endTerm: null }],
        deletedAt: null,
      },
    });
    if (president !== 0) return true;
    return false;
  }
}
