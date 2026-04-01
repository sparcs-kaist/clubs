import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { PrismaTransactionClient } from "@sparcs-clubs/api/common/base/base.repository";
import logger from "@sparcs-clubs/api/common/util/logger";

type SyncDelegateMemberRegistrationsParam = {
  tx: PrismaTransactionClient;
  clubId: number;
  semesterId: number;
  startTerm: Date;
  endTerm: Date;
  studentIds?: number[];
};

export async function syncDelegateMemberRegistrations({
  tx,
  clubId,
  semesterId,
  startTerm,
  endTerm,
  studentIds,
}: SyncDelegateMemberRegistrationsParam): Promise<void> {
  const targetStudentIds = studentIds?.length
    ? [...new Set(studentIds)]
    : [
        ...new Set(
          (
            await tx.clubDelegateD.findMany({
              where: {
                clubId,
                startTerm: { lte: endTerm },
                OR: [{ endTerm: { gte: startTerm } }, { endTerm: null }],
                deletedAt: null,
              },
              select: { studentId: true },
            })
          ).map(delegate => delegate.studentId),
        ),
      ];

  if (targetStudentIds.length === 0) {
    return;
  }

  const existingStudents = await tx.student.findMany({
    where: {
      id: { in: targetStudentIds },
      deletedAt: null,
    },
    select: { id: true },
  });
  const validStudentIds = existingStudents.map(student => student.id);

  if (validStudentIds.length === 0) {
    return;
  }

  const existingApplications = await tx.registrationApplicationStudent.findMany(
    {
      where: {
        clubId,
        semesterId,
        studentId: { in: validStudentIds },
        deletedAt: null,
      },
      select: {
        id: true,
        studentId: true,
        registrationApplicationStudentEnum: true,
      },
    },
  );

  const applicationStudentIdSet = new Set(
    existingApplications.map(application => application.studentId),
  );
  const missingApplicationStudentIds = validStudentIds.filter(
    studentId => !applicationStudentIdSet.has(studentId),
  );

  if (missingApplicationStudentIds.length > 0) {
    await tx.registrationApplicationStudent.createMany({
      data: missingApplicationStudentIds.map(studentId => ({
        studentId,
        clubId,
        semesterId,
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Approved,
      })),
    });
  }

  const applicationIdsToApprove = existingApplications
    .filter(
      application =>
        application.registrationApplicationStudentEnum !==
        RegistrationApplicationStudentStatusEnum.Approved,
    )
    .map(application => application.id);

  if (applicationIdsToApprove.length > 0) {
    await tx.registrationApplicationStudent.updateMany({
      where: {
        id: { in: applicationIdsToApprove },
        deletedAt: null,
      },
      data: {
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Approved,
      },
    });
  }

  const existingClubMembers = await tx.clubStudentT.findMany({
    where: {
      clubId,
      semesterId,
      studentId: { in: validStudentIds },
      deletedAt: null,
    },
    select: { studentId: true },
  });

  const clubMemberStudentIdSet = new Set(
    existingClubMembers.map(member => member.studentId),
  );
  const missingClubMemberStudentIds = validStudentIds.filter(
    studentId => !clubMemberStudentIdSet.has(studentId),
  );

  if (missingClubMemberStudentIds.length > 0) {
    await tx.clubStudentT.createMany({
      data: missingClubMemberStudentIds.map(studentId => ({
        studentId,
        clubId,
        semesterId,
        startTerm,
        endTerm,
      })),
    });
  }

  logger.debug("[syncDelegateMemberRegistrations] synchronized delegate data", {
    clubId,
    semesterId,
    delegateCount: validStudentIds.length,
    createdApplications: missingApplicationStudentIds.length,
    approvedApplications: applicationIdsToApprove.length,
    createdClubMembers: missingClubMemberStudentIds.length,
  });
}
