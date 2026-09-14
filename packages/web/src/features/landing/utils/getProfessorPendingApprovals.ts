import type { ApiAct019ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct019";
import type { ApiReg021ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg021";

export type ProfessorPendingApproval = {
  clubId: number;
  clubName: string;
  activityCount: number;
  registrationIds: number[];
};

export const getProfessorPendingApprovals = (
  semesterId: number,
  clubActivities: {
    id: number;
    nameKr: string;
    activities: Pick<ApiAct019ResponseOk[number], "professorApprovedAt">[];
  }[],
  registrations: Pick<
    ApiReg021ResponseOk["items"][number],
    "id" | "clubId" | "newClubNameKr" | "semesterId" | "professorSignedAt"
  >[],
): ProfessorPendingApproval[] => {
  const clubs = new Map<number, ProfessorPendingApproval>();
  clubActivities.forEach(club => {
    const activityCount = club.activities.filter(
      activity => activity.professorApprovedAt === null,
    ).length;
    if (activityCount === 0) return;
    clubs.set(club.id, {
      clubId: club.id,
      clubName: club.nameKr,
      activityCount,
      registrationIds: [],
    });
  });
  registrations.forEach(registration => {
    if (registration.semesterId !== semesterId) return;
    if (registration.professorSignedAt !== null) return;
    const club = clubs.get(registration.clubId) ?? {
      clubId: registration.clubId,
      clubName: registration.newClubNameKr,
      activityCount: 0,
      registrationIds: [],
    };
    club.registrationIds.push(registration.id);
    clubs.set(club.clubId, club);
  });
  return [...clubs.values()].sort(
    (a, b) => a.clubName.localeCompare(b.clubName, "ko") || a.clubId - b.clubId,
  );
};
