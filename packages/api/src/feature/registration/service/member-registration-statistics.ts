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
  regularStudent: number;
};

type GetMemberRegistrationStatisticsParam = {
  registrations: MemberRegistrationStatisticSource[];
  studentEnumByStudentId: Map<number, number>;
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

/**
 * Computes REG-020 statistics from the full, unpaginated club registration list.
 */
export function getMemberRegistrationStatistics({
  registrations,
  studentEnumByStudentId,
  statusEnumIds,
}: GetMemberRegistrationStatisticsParam): MemberRegistrationStatistics {
  const isRegularMemberRegistration = (
    registration: MemberRegistrationStatisticSource,
  ) =>
    studentEnumByStudentId.get(registration.student.id) ===
    statusEnumIds.regularStudent;

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
    regularMemberRegistrations: registrations.filter(
      isRegularMemberRegistration,
    ).length,
    regularMemberWaitings: registrations.filter(
      registration =>
        isRegularMemberRegistration(registration) &&
        hasStatus(registration, statusEnumIds.pending),
    ).length,
    regularMemberApprovals: registrations.filter(
      registration =>
        isRegularMemberRegistration(registration) &&
        hasStatus(registration, statusEnumIds.approved),
    ).length,
    regularMemberRejections: registrations.filter(
      registration =>
        isRegularMemberRegistration(registration) &&
        hasStatus(registration, statusEnumIds.rejected),
    ).length,
  };
}
