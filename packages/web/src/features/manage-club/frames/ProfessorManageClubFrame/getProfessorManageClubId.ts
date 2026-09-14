export const getProfessorManageClubId = (
  clubs: readonly { id: number }[],
  requestedClubId: string | null,
) =>
  clubs.find(club => club.id > 0 && club.id.toString() === requestedClubId)
    ?.id ??
  clubs[0]?.id ??
  null;
