"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import styled from "styled-components";

import { apiOfh001, apiOfh002 } from "@clubs/interface/api/office-hours";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { axiosClient, axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";
import { formatTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getLocalDateOnly } from "@sparcs-clubs/web/utils/Date/getKSTDate";

import OfficeHourEditor from "./components/OfficeHourEditor";
import OfficeHoursCalendar from "./components/OfficeHoursCalendar";
import OfficeHoursForm from "./components/OfficeHoursForm";

const PublicMemo = styled.article`
  p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;

const OfficeHoursFrame = ({ executive = false }: { executive?: boolean }) => {
  const t = useTranslations("officeHours");
  const paths = useTranslations("path");
  const formatter = useFormatter();
  const { profile } = useAuth();
  const [month, setMonth] = useState(() =>
    startOfMonth(getLocalDateOnly(new Date())),
  );
  const [selectedDate, setSelectedDate] = useState<string | undefined>(() =>
    executive ? undefined : format(getLocalDateOnly(new Date()), "yyyy-MM-dd"),
  );
  const from = format(month, "yyyy-MM-dd");
  const to = format(endOfMonth(month), "yyyy-MM-dd");
  const endpoint = executive ? apiOfh002 : apiOfh001;
  const client = executive ? axiosClientWithAuth : axiosClient;
  const officeHours = useQuery({
    queryKey: [
      "office-hours",
      endpoint.url(),
      { from, to, viewerId: executive ? profile?.id : undefined },
    ],
    queryFn: async () => {
      const { data } = await client.get(endpoint.url(), {
        params: { from, to },
      });
      return executive
        ? { executive, ...apiOfh002.responseBodyMap[200].parse(data) }
        : { executive, ...apiOfh001.responseBodyMap[200].parse(data) };
    },
  });
  const items = officeHours.data?.items ?? [];
  const selectedOfficeHour = officeHours.data?.executive
    ? officeHours.data.items.find(item => item.date === selectedDate)
    : undefined;
  const title = executive ? paths("상근일 관리") : paths("상근일 현황");
  const selectedPublicOfficeHour = items.find(
    item => item.date === selectedDate,
  );

  return (
    <FlexWrapper direction="column" gap={24}>
      <PageHead
        items={
          executive
            ? [
                { name: paths("집행부원 대시보드"), path: "/executive" },
                { name: title, path: "/executive/office-hours" },
              ]
            : [{ name: title, path: "/office-hours" }]
        }
        title={title}
      />
      {executive && <p>{t("editDescription")}</p>}
      <OfficeHoursCalendar
        month={month}
        items={items}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onMonthChange={date => {
          setMonth(date);
          setSelectedDate(undefined);
        }}
      >
        <AsyncBoundary
          isLoading={officeHours.isLoading}
          isError={officeHours.isError}
          renderIfError={
            <FlexWrapper direction="column" gap={8}>
              <p role="alert">{t("loadError")}</p>
              <div>
                <Button type="outlined" onClick={() => officeHours.refetch()}>
                  {t("retry")}
                </Button>
              </div>
            </FlexWrapper>
          }
        >
          {null}
        </AsyncBoundary>
      </OfficeHoursCalendar>
      {!executive && officeHours.isSuccess && selectedDate && (
        <Card outline gap={16}>
          <PublicMemo aria-live="polite">
            <FlexWrapper direction="column" gap={8}>
              <h2>
                {t("dateMemo", {
                  date: formatter.dateTime(
                    new Date(`${selectedDate}T00:00:00+09:00`),
                    {
                      timeZone: "Asia/Seoul",
                      dateStyle: "long",
                    },
                  ),
                })}
              </h2>
              {selectedPublicOfficeHour &&
                !selectedPublicOfficeHour.isClosed && (
                  <p>
                    {formatTime(new Date(selectedPublicOfficeHour.opensAt))}~
                    {formatTime(new Date(selectedPublicOfficeHour.closesAt))}
                  </p>
                )}
              {selectedPublicOfficeHour?.isClosed && (
                <Typography color="RED.600">{t("officeClosed")}</Typography>
              )}
              {!selectedPublicOfficeHour && (
                <Typography color="RED.600">{t("noOfficeHours")}</Typography>
              )}
              {selectedPublicOfficeHour?.publicMemo && (
                <p>{selectedPublicOfficeHour.publicMemo}</p>
              )}
            </FlexWrapper>
          </PublicMemo>
        </Card>
      )}
      {executive && officeHours.isSuccess && selectedDate && (
        <OfficeHourEditor
          key={JSON.stringify([
            selectedDate,
            selectedOfficeHour?.opensAt,
            selectedOfficeHour?.closesAt,
            selectedOfficeHour?.isClosed,
            selectedOfficeHour?.publicMemo,
            selectedOfficeHour?.internalMemo,
          ])}
          date={selectedDate}
          officeHour={selectedOfficeHour}
        />
      )}
      {executive && <OfficeHoursForm key={from} from={from} to={to} />}
    </FlexWrapper>
  );
};

export default OfficeHoursFrame;
