export type ActivityDeadlineRange = {
  startTerm: Date | string;
  endTerm: Date | string;
};

export const hasOverlappingActivityDeadline = (
  existingDeadlines: ActivityDeadlineRange[],
  candidateDeadline: ActivityDeadlineRange,
): boolean => {
  const candidateStart = new Date(candidateDeadline.startTerm);
  const candidateEnd = new Date(candidateDeadline.endTerm);

  return existingDeadlines.some(deadline => {
    const existingStart = new Date(deadline.startTerm);
    const existingEnd = new Date(deadline.endTerm);

    return candidateStart < existingEnd && candidateEnd > existingStart;
  });
};
