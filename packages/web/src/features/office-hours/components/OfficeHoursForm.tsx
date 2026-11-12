import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styled from "styled-components";

import { apiOfh003 } from "@clubs/interface/api/office-hours";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import getApiErrorMessage from "@sparcs-clubs/web/common/services/getApiErrorMessage";
import { rentalQueryKey } from "@sparcs-clubs/web/features/rental-business/services/rentalApi";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const OfficeHoursFields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  input:not([type="checkbox"]) {
    border: 1px solid ${({ theme }) => theme.colors.GRAY[300]};
    border-radius: 4px;
    color: inherit;
    background: ${({ theme }) => theme.colors.WHITE};
    padding: 6px 8px;
    font: inherit;
  }
`;

const OfficeHoursForm = ({ from, to }: { from: string; to: string }) => {
  const t = useTranslations("officeHours");
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(from);
  const [endDate, setEndDate] = useState(to);
  const generate = useMutation({
    mutationFn: async () => {
      const request = apiOfh003.requestBody.parse({
        from: startDate,
        to: endDate,
      });
      const { data } = await axiosClientWithAuth.post(apiOfh003.url(), request);
      return apiOfh003.responseBodyMap[201].parse(data);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["office-hours"] }),
        queryClient.invalidateQueries({ queryKey: rentalQueryKey }),
      ]);
    },
  });

  return (
    <Card outline gap={12} padding="16px">
      <strong>{t("generateTitle")}</strong>
      <p>{t("generateDescription")}</p>
      <form
        onSubmit={event => {
          event.preventDefault();
          generate.mutate();
        }}
      >
        <OfficeHoursFields>
          <label htmlFor="office-hours-generation-from">
            {t("from")}
            <input
              id="office-hours-generation-from"
              required
              type="date"
              value={startDate}
              max={endDate}
              onChange={event => setStartDate(event.target.value)}
            />
          </label>
          <label htmlFor="office-hours-generation-to">
            {t("to")}
            <input
              id="office-hours-generation-to"
              required
              type="date"
              min={startDate}
              value={endDate}
              onChange={event => setEndDate(event.target.value)}
            />
          </label>
          <Button
            buttonType="submit"
            type={generate.isPending ? "disabled" : "default"}
          >
            {t("generate")}
          </Button>
        </OfficeHoursFields>
      </form>
      {generate.isSuccess && (
        <p role="status">
          {t("generated", { count: generate.data.createdCount })}
        </p>
      )}
      {generate.isError && (
        <p role="alert">{getApiErrorMessage(generate.error, t("saveError"))}</p>
      )}
    </Card>
  );
};

export default OfficeHoursForm;
