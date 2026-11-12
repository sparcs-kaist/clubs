import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { apiOfh004, type OfficeHour } from "@clubs/interface/api/office-hours";
import { apiRentalsExecutive } from "@clubs/interface/api/rental/v2";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import NotificationCard from "@sparcs-clubs/web/common/components/NotificationCard";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import getApiErrorMessage from "@sparcs-clubs/web/common/services/getApiErrorMessage";
import { rentalQueryKey } from "@sparcs-clubs/web/features/rental-business/services/rentalApi";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";
import { formatTime } from "@sparcs-clubs/web/utils/Date/formatDate";

import { OfficeHoursFields } from "./OfficeHoursForm";

const reservationsPerPage = 100;

async function fetchReservations(officeDate: string, pageOffset: number) {
  const { data } = await axiosClientWithAuth.get(apiRentalsExecutive.url(), {
    params: { officeDate, pageOffset, itemCount: reservationsPerPage },
  });

  return apiRentalsExecutive.responseBodyMap[200].parse(data);
}

const OfficeHourEditor = ({
  date,
  officeHour,
}: {
  date: string;
  officeHour?: OfficeHour;
}) => {
  const t = useTranslations("officeHours");
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [openTime, setOpenTime] = useState(
    officeHour ? formatTime(new Date(officeHour.opensAt)) : "21:00",
  );
  const [closeTime, setCloseTime] = useState(
    officeHour ? formatTime(new Date(officeHour.closesAt)) : "22:00",
  );
  const [isClosed, setIsClosed] = useState(officeHour?.isClosed ?? false);
  const reservations = useQuery({
    queryKey: [...rentalQueryKey, "office-hours-impact", profile?.id, date],
    staleTime: 0,
    queryFn: async () => {
      const first = await fetchReservations(date, 1);
      const pageCount = Math.ceil(first.total / reservationsPerPage);
      const pages = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          fetchReservations(date, index + 2),
        ),
      );
      return [first, ...pages]
        .flatMap(page => page.items)
        .filter(
          rental =>
            rental.status === "RESERVED" ||
            (rental.status === "CHECKED_OUT" && rental.return.date === date),
        );
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      const request = apiOfh004.requestBody.parse({
        openTime,
        closeTime,
        isClosed,
      });
      const { data } = await axiosClientWithAuth.put(
        apiOfh004.url(date),
        request,
      );
      return apiOfh004.responseBodyMap[200].parse(data);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["office-hours"] }),
        queryClient.invalidateQueries({ queryKey: rentalQueryKey }),
      ]);
    },
  });
  const invalidTimes = !openTime || !closeTime || closeTime <= openTime;
  const canSave =
    reservations.isSuccess &&
    !reservations.isFetching &&
    !save.isPending &&
    !invalidTimes;

  return (
    <Card outline padding="16px" gap={12}>
      <strong>{t("editDate", { date })}</strong>
      <form
        onSubmit={event => {
          event.preventDefault();
          if (canSave) save.mutate();
        }}
      >
        <FlexWrapper direction="column" gap={12}>
          <OfficeHoursFields>
            <label htmlFor="office-hour-opening-time">
              {t("opensAt")}
              <input
                id="office-hour-opening-time"
                required
                type="time"
                value={openTime}
                onChange={event => setOpenTime(event.target.value)}
              />
            </label>
            <label htmlFor="office-hour-closing-time">
              {t("closesAt")}
              <input
                id="office-hour-closing-time"
                required
                type="time"
                value={closeTime}
                onChange={event => setCloseTime(event.target.value)}
              />
            </label>
          </OfficeHoursFields>
          <label htmlFor="office-hour-closure">
            <input
              id="office-hour-closure"
              type="checkbox"
              checked={isClosed}
              onChange={event => setIsClosed(event.target.checked)}
            />{" "}
            {t("markClosed")}
          </label>
          {invalidTimes && <p role="alert">{t("invalidTimes")}</p>}
          {reservations.isFetching && <p role="status">{t("loadingImpact")}</p>}
          {reservations.isError && (
            <FlexWrapper direction="column" gap={8}>
              <p role="alert">{t("impactError")}</p>
              <div>
                <Button type="outlined" onClick={() => reservations.refetch()}>
                  {t("retry")}
                </Button>
              </div>
            </FlexWrapper>
          )}
          {!!reservations.data?.length && (
            <NotificationCard status="Alert" header={t("affectedRentals")}>
              <p>{t("affectedDescription")}</p>
              <ul>
                {reservations.data.map(rental => {
                  const pickup =
                    rental.status === "RESERVED" && rental.pickup.date === date;
                  return (
                    <li key={rental.id}>
                      <Link href={`/executive/rental-business/${rental.id}`}>
                        {pickup ? t("pickup") : t("return")} · {rental.clubName}{" "}
                        · {rental.itemName} × {rental.quantity}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </NotificationCard>
          )}
          <div>
            <Button buttonType="submit" type={canSave ? "default" : "disabled"}>
              {t("save")}
            </Button>
          </div>
          {save.isSuccess && <p role="status">{t("saved")}</p>}
          {save.isError && (
            <p role="alert">{getApiErrorMessage(save.error, t("saveError"))}</p>
          )}
        </FlexWrapper>
      </form>
    </Card>
  );
};

export default OfficeHourEditor;
