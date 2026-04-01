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
  referenceDate?: Date;
};

export async function syncDelegateMemberRegistrations({
  tx,
  clubId,
  semesterId,
  startTerm,
  endTerm,
  studentIds,
  referenceDate = new Date(),
}: SyncDelegateMemberRegistrationsParam): Promise<void> {
  const targetStudentIds = studentIds?.length
    ? [...new Set(studentIds)]
    : [
        ...new Set(
          (
            await tx.clubDelegateD.findMany({
              where: {
                clubId,
                startTerm: { lte: referenceDate },
                OR: [{ endTerm: { gte: referenceDate } }, { endTerm: null }],
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

  const existingApplications = await tx.registrationApplicationStudent.findMany(
    {
      where: {
        clubId,
        semesterId,
        studentId: { in: targetStudentIds },
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
  const missingApplicationStudentIds = targetStudentIds.filter(
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
      skipDuplicates: true,
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
      studentId: { in: targetStudentIds },
      deletedAt: null,
    },
    select: { studentId: true },
  });

  const clubMemberStudentIdSet = new Set(
    existingClubMembers.map(member => member.studentId),
  );
  const missingClubMemberStudentIds = targetStudentIds.filter(
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
      skipDuplicates: true,
    });
  }

  logger.debug("[syncDelegateMemberRegistrations] synchronized delegate data", {
    clubId,
    semesterId,
    delegateCount: targetStudentIds.length,
    createdApplications: missingApplicationStudentIds.length,
    approvedApplications: applicationIdsToApprove.length,
    createdClubMembers: missingClubMemberStudentIds.length,
  });
}
