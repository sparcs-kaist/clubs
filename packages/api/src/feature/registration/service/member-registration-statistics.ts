type MemberRegistrationStatisticSource = {
  registrationApplicationStudentEnum: number;
  student: {
    id: number;
  };
};

type MemberRegistrationStatisticStatusEnumIds = {
  pending: number;
  approved: number;
  rejected: number;
};

type GetMemberRegistrationStatisticsParam = {
  registrations: MemberRegistrationStatisticSource[];
  studentEnumByStudentId: Map<number, number>;
  studentById: Map<number, { studentNumber: string }>;
  statusEnumIds: MemberRegistrationStatisticStatusEnumIds;
};

export type MemberRegistrationStatistics = {
  totalRegistrations: number;
  totalWaitings: number;
  totalApprovals: number;
  totalRejections: number;
  regularMemberRegistrations: number;
  regularMemberWaitings: number;
  regularMemberApprovals: number;
  regularMemberRejections: number;
};

export function isUndergraduateMemberRegistration(
  studentEnumId: number | undefined,
  studentNumber: string | undefined,
): boolean {
  const studentNumberSuffix = Number(studentNumber?.slice(-4));
  const isUndergraduate = studentEnumId === 1 && studentNumberSuffix < 6000;
  return isUndergraduate;
}

/** Computes statistics from the full, unpaginated club registration list. */
export function getMemberRegistrationStatistics({
  registrations,
  studentEnumByStudentId,
  studentById,
  statusEnumIds,
}: GetMemberRegistrationStatisticsParam): MemberRegistrationStatistics {
  const regularRegistrations = registrations.filter(registration =>
    isUndergraduateMemberRegistration(
      studentEnumByStudentId.get(registration.student.id),
      studentById.get(registration.student.id)?.studentNumber,
    ),
  );

  const hasStatus = (
    registration: MemberRegistrationStatisticSource,
    status: number,
  ) => registration.registrationApplicationStudentEnum === status;

  return {
    totalRegistrations: registrations.length,
    totalWaitings: registrations.filter(registration =>
      hasStatus(registration, statusEnumIds.pending),
    ).length,
    totalApprovals: registrations.filter(registration =>
      hasStatus(registration, statusEnumIds.approved),
    ).length,
    totalRejections: registrations.filter(registration =>
      hasStatus(registration, statusEnumIds.rejected),
    ).length,
    regularMemberRegistrations: regularRegistrations.length,
    regularMemberWaitings: regularRegistrations.filter(registration =>
      hasStatus(registration, statusEnumIds.pending),
    ).length,
    regularMemberApprovals: regularRegistrations.filter(registration =>
      hasStatus(registration, statusEnumIds.approved),
    ).length,
    regularMemberRejections: regularRegistrations.filter(registration =>
      hasStatus(registration, statusEnumIds.rejected),
    ).length,
  };
}
