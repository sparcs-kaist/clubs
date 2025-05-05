import { useMutation, useQueryClient } from "@tanstack/react-query";

import { newActivityReportListQueryKey } from "../services/useGetNewActivityReportList";
import usePostActivityReport from "../services/usePostActivityReport";
import { ActivityReportFormData } from "../types/form";

export const useCreateActivityReport = (clubId: number) => {
  const queryClient = useQueryClient();
  const { mutateAsync: createActivityReport } = usePostActivityReport();

  return useMutation({
    mutationFn: (data: ActivityReportFormData) =>
      createActivityReport(
        {
          body: {
            ...data,
            clubId,
            duration: data.durations.map(duration => ({
              startTerm: duration.startTerm!,
              endTerm: duration.endTerm!,
            })),
            evidenceFiles: data.evidenceFiles.map(file => ({
              uid: file.id,
            })),
            participants: data.participants.map(participant => ({
              studentId: participant.id,
            })),
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: newActivityReportListQueryKey(clubId),
            });
          },
        },
      ),
  });
};
