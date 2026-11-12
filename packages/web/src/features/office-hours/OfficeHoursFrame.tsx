"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { apiOfh001, apiOfh002 } from "@clubs/interface/api/office-hours";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { axiosClient, axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";
import { getLocalDateOnly } from "@sparcs-clubs/web/utils/Date/getKSTDate";

import OfficeHourEditor from "./components/OfficeHourEditor";
import OfficeHoursCalendar from "./components/OfficeHoursCalendar";
import OfficeHoursForm from "./components/OfficeHoursForm";

const OfficeHoursFrame = ({ executive = false }: { executive?: boolean }) => {
  const t = useTranslations("officeHours");
  const paths = useTranslations("path");
  const [month, setMonth] = useState(() =>
    startOfMonth(getLocalDateOnly(new Date())),
  );
  const [selectedDate, setSelectedDate] = useState<string>();
  const from = format(month, "yyyy-MM-dd");
  const to = format(endOfMonth(month), "yyyy-MM-dd");
  const endpoint = executive ? apiOfh002 : apiOfh001;
  const client = executive ? axiosClientWithAuth : axiosClient;
  const officeHours = useQuery({
    queryKey: ["office-hours", endpoint.url(), { from, to }],
    queryFn: async () => {
      const { data } = await client.get(endpoint.url(), {
        params: { from, to },
      });
      return endpoint.responseBodyMap[200].parse(data);
    },
  });
  const items = officeHours.data?.items ?? [];
  const selectedOfficeHour = items.find(item => item.date === selectedDate);
  const title = executive ? paths("상근일 관리") : paths("상근일 현황");

  return (
    <FlexWrapper direction="column" gap={24}>
      <PageHead
        items={
          executive
            ? [{ name: paths("집행부"), path: "/executive" }]
            : [{ name: title, path: "/office-hours" }]
        }
        title={title}
      />
      <p>{t(executive ? "editDescription" : "publicDescription")}</p>
      <OfficeHoursCalendar
        month={month}
        items={items}
        selectedDate={selectedDate}
        onDateSelect={
          executive && officeHours.isSuccess ? setSelectedDate : undefined
        }
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
          {items.length === 0 && <p role="status">{t("emptyMonth")}</p>}
        </AsyncBoundary>
      </OfficeHoursCalendar>
      {executive && officeHours.isSuccess && selectedDate && (
        <OfficeHourEditor
          key={`${selectedDate}:${selectedOfficeHour?.version ?? 0}`}
          date={selectedDate}
          officeHour={selectedOfficeHour}
        />
      )}
      {executive && <OfficeHoursForm key={from} from={from} to={to} />}
    </FlexWrapper>
  );
};

export default OfficeHoursFrame;
