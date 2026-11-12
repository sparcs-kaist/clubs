import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import type {
  ExecutiveRentalReservation,
  RentalStatus,
} from "@clubs/interface/api/rental/v2";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

import {
  type ExecutiveRentalAction,
  performExecutiveRentalAction,
  rentalQueryKey,
  useRentalOfficeHours,
} from "../services/rentalApi";
import {
  addRentalDays,
  formatRentalSlot,
  todayRentalDate,
} from "../utils/rentalSchedule";
import {
  RentalActions,
  RentalError,
  RentalField,
  RentalFieldGrid,
  RentalSelect,
  RentalTextarea,
} from "./RentalFields";

const actionLabels: Record<ExecutiveRentalAction["name"], string> = {
  checkout: "수령 확인",
  return: "반납 확인",
  cancel: "예약 취소",
  reject: "예약 반려",
  schedule: "일정 조정",
  extend: "반납 연장",
};

const actionsByStatus: Partial<
  Record<RentalStatus, ExecutiveRentalAction["name"][]>
> = {
  RESERVED: ["checkout", "schedule", "extend", "cancel", "reject"],
  CHECKED_OUT: ["return", "schedule", "extend"],
};

type ScheduleAction = Extract<
  ExecutiveRentalAction,
  { name: "schedule" | "extend" }
>;

const ScheduleForm = ({
  order,
  action,
  onSubmit,
  busy,
}: {
  order: ExecutiveRentalReservation;
  action: ScheduleAction["name"];
  onSubmit: (payload: ScheduleAction) => void;
  busy: boolean;
}) => {
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const today = todayRentalDate();
  const isExtension = action === "extend";
  const extensionDays = order.durationPolicy === "DAYS_14" ? 14 : 7;
  const extensionLimit = addRentalDays(
    order.regularReturnLimitDate,
    extensionDays,
  );
  const extensionStart = [
    today,
    addRentalDays(order.return.date, 1),
    addRentalDays(order.regularReturnLimitDate, 1),
  ].sort()[2];
  const officeHours = useRentalOfficeHours(
    isExtension ? extensionStart : today,
    isExtension ? extensionLimit : addRentalDays(today, 365),
    !isExtension || extensionStart <= extensionLimit,
  );
  const slots =
    officeHours.data?.filter(
      slot => !slot.isClosed && new Date(slot.closesAt).getTime() > Date.now(),
    ) ?? [];
  const pickupSlots = slots.filter(
    slot =>
      slot.date !== order.pickup.date || slot.version !== order.pickup.version,
  );
  const pickup = pickupSlots.find(slot => slot.date === pickupDate);
  const nextPickupDate = pickup?.date ?? order.pickup.date;
  const hasNewPickupDate = nextPickupDate !== order.pickup.date;
  const isTwoShiftPolicy = order.durationPolicy === "SECOND_NEXT_OFFICE_HOUR";
  const nextOfficeHours = useRentalOfficeHours(
    nextPickupDate,
    addRentalDays(nextPickupDate, isTwoShiftPolicy ? 365 : 14),
    hasNewPickupDate,
  );
  const laterSlots = hasNewPickupDate
    ? (nextOfficeHours.data?.filter(
        slot => !slot.isClosed && slot.date > nextPickupDate,
      ) ?? [])
    : slots.filter(slot => slot.date > nextPickupDate);
  let regularLimit: string | undefined =
    order.approvedReturnLimitDate ?? order.regularReturnLimitDate;
  if (hasNewPickupDate) {
    regularLimit = isTwoShiftPolicy
      ? laterSlots[1]?.date
      : addRentalDays(nextPickupDate, 14);
  }
  const returnSlots = isExtension
    ? slots
    : laterSlots.filter(
        slot =>
          regularLimit !== undefined &&
          slot.date <= regularLimit &&
          (slot.date !== order.return.date ||
            slot.version !== order.return.version),
      );
  const returnSlot = returnSlots.find(slot => slot.date === returnDate);
  const keepReturn = Boolean(
    pickup &&
    regularLimit &&
    order.return.date <= regularLimit &&
    laterSlots.some(
      slot =>
        slot.date === order.return.date &&
        slot.opensAt === order.return.opensAt &&
        slot.closesAt === order.return.closesAt,
    ),
  );
  const canSubmit =
    (!pickupDate || Boolean(pickup)) &&
    (returnDate ? Boolean(returnSlot) : keepReturn);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || busy) return;
    const nextReturn = returnSlot && {
      date: returnSlot.date,
      version: returnSlot.version,
    };
    if (isExtension && nextReturn) {
      const reason = String(
        new FormData(event.currentTarget).get("reason") ?? "",
      ).trim();
      onSubmit({ name: "extend", body: { return: nextReturn, reason } });
    } else if (!isExtension) {
      onSubmit({
        name: "schedule",
        body: {
          pickup: pickup && { date: pickup.date, version: pickup.version },
          return: nextReturn,
        },
      });
    }
  };

  if (officeHours.isLoading) {
    return <AsyncBoundary isLoading isError={false} />;
  }
  if (officeHours.isError) {
    return (
      <RentalError
        error={officeHours.error}
        fallback="조정 가능한 상근 일정을 불러오지 못했습니다."
        retry={() => officeHours.refetch()}
      />
    );
  }
  return (
    <form onSubmit={submit}>
      <FlexWrapper direction="column" gap={12}>
        <RentalFieldGrid>
          {!isExtension && order.status === "RESERVED" && (
            <RentalField>
              새 수령 상근일
              <RentalSelect
                value={pickupDate}
                onChange={event => {
                  setPickupDate(event.target.value);
                  setReturnDate("");
                }}
              >
                <option value="">기존 일정 유지</option>
                {pickupSlots.map(slot => (
                  <option key={slot.date} value={slot.date}>
                    {formatRentalSlot(slot)}
                  </option>
                ))}
              </RentalSelect>
            </RentalField>
          )}
          <RentalField>
            새 반납 상근일
            <RentalSelect
              value={returnDate}
              disabled={nextOfficeHours.isLoading}
              required={isExtension || Boolean(pickup && !keepReturn)}
              onChange={event => setReturnDate(event.target.value)}
            >
              <option value="">
                {!isExtension && keepReturn
                  ? "기존 일정 유지"
                  : "반납 일정 선택"}
              </option>
              {returnSlots.map(slot => (
                <option key={slot.date} value={slot.date}>
                  {formatRentalSlot(slot)}
                </option>
              ))}
            </RentalSelect>
          </RentalField>
        </RentalFieldGrid>
        {nextOfficeHours.isLoading && (
          <AsyncBoundary isLoading isError={false} />
        )}
        {nextOfficeHours.isError && (
          <RentalError
            error={nextOfficeHours.error}
            fallback="새 수령일 이후의 상근 일정을 불러오지 못했습니다."
            retry={nextOfficeHours.refetch}
          />
        )}
        {returnSlots.length === 0 &&
          !nextOfficeHours.isLoading &&
          !nextOfficeHours.isError && (
            <p>선택할 수 있는 반납 일정이 없습니다.</p>
          )}
        {isExtension && (
          <RentalField>
            연장 사유
            <RentalTextarea name="reason" required maxLength={500} />
          </RentalField>
        )}
        <RentalActions>
          <Button
            buttonType="submit"
            type={busy || !canSubmit ? "disabled" : "default"}
          >
            {actionLabels[action]}
          </Button>
        </RentalActions>
      </FlexWrapper>
    </form>
  );
};

const ExecutiveRentalActionForm = ({
  order,
  userId,
  openExtension,
}: {
  order: ExecutiveRentalReservation;
  userId: number;
  openExtension: boolean;
}) => {
  const [selected, setSelected] = useState<
    ExecutiveRentalAction["name"] | undefined
  >(openExtension ? "extend" : undefined);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: ExecutiveRentalAction) =>
      performExecutiveRentalAction(order.id, payload),
    onSuccess: reservation => {
      queryClient.setQueryData(
        [...rentalQueryKey, "executive-order", userId, order.id],
        reservation,
      );
      queryClient.invalidateQueries({ queryKey: rentalQueryKey });
      setSelected(undefined);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: rentalQueryKey }),
  });
  const actions = actionsByStatus[order.status] ?? [];
  const action = selected && actions.includes(selected) ? selected : undefined;
  const confirmType =
    action === "cancel" || action === "reject" ? "danger" : "default";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const data = new FormData(event.currentTarget);
    if (action === "checkout") {
      const memo = String(data.get("memo") ?? "").trim();
      mutation.mutate({ name: action, body: memo ? { memo } : {} });
    }
    if (action === "return") mutation.mutate({ name: action, body: {} });
    if (action === "cancel" || action === "reject") {
      const reason = String(data.get("reason") ?? "").trim();
      mutation.mutate({ name: action, body: { reason } });
    }
  };

  return (
    <FlexWrapper direction="column" gap={12}>
      <RentalActions>
        {actions.map(name => {
          const buttonType = action === name ? "default" : "outlined";
          return (
            <Button
              key={name}
              type={mutation.isPending ? "disabled" : buttonType}
              aria-pressed={action === name}
              onClick={() => {
                mutation.reset();
                setSelected(action === name ? undefined : name);
              }}
            >
              {actionLabels[name]}
            </Button>
          );
        })}
      </RentalActions>
      {(action === "schedule" || action === "extend") && (
        <ScheduleForm
          key={action}
          order={order}
          action={action}
          busy={mutation.isPending}
          onSubmit={mutation.mutate}
        />
      )}
      {action && action !== "schedule" && action !== "extend" && (
        <form key={action} onSubmit={submit}>
          <FlexWrapper direction="column" gap={12}>
            {action === "checkout" && (
              <RentalField>
                인계 메모 (선택)
                <RentalTextarea
                  name="memo"
                  placeholder="예: 이젤 3번, 5번 인계"
                  maxLength={500}
                />
              </RentalField>
            )}
            {action === "return" && (
              <p>물품과 수량을 확인한 뒤 반납을 완료해 주세요.</p>
            )}
            {(action === "cancel" || action === "reject") && (
              <RentalField>
                {action === "cancel" ? "취소 사유" : "반려 사유"}
                <RentalTextarea name="reason" required maxLength={500} />
              </RentalField>
            )}
            <RentalActions>
              <Button
                buttonType="submit"
                type={mutation.isPending ? "disabled" : confirmType}
              >
                {mutation.isPending
                  ? "처리 중"
                  : `${actionLabels[action]} 저장`}
              </Button>
            </RentalActions>
          </FlexWrapper>
        </form>
      )}
      {mutation.isError && (
        <RentalError
          error={mutation.error}
          fallback="대여 내역을 처리하지 못했습니다."
        />
      )}
    </FlexWrapper>
  );
};

export default ExecutiveRentalActionForm;
