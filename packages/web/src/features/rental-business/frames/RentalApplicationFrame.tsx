import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Info from "@sparcs-clubs/web/common/components/Info";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import {
  RentalActions,
  RentalAuth,
  RentalError,
  RentalField,
  RentalFieldGrid,
  RentalInput,
  RentalLink,
  RentalSelect,
  RentalTextarea,
} from "../components/RentalFields";
import {
  createRental,
  rentalQueryKey,
  useRentalEligibleClubs,
  useRentalItems,
  useRentalOfficeHours,
  useRentalReturnOptions,
} from "../services/rentalApi";
import {
  addRentalDays,
  formatRentalSlot,
  rentalPolicyLabels,
  todayRentalDate,
} from "../utils/rentalSchedule";

const RentalApplicationForm = ({
  userId,
  applicant,
}: {
  userId: number;
  applicant: string;
}) => {
  const [clubId, setClubId] = useState(0);
  const [itemId, setItemId] = useState(0);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const request = useRef<{ key: string; id: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();
  const today = todayRentalDate();
  const clubs = useRentalEligibleClubs(userId);
  const items = useRentalItems();
  const officeHours = useRentalOfficeHours(today, addRentalDays(today, 365));
  const returnOptions = useRentalReturnOptions(itemId, pickupDate);
  const submit = useMutation({
    mutationFn: createRental,
    onSuccess: reservation => {
      queryClient.invalidateQueries({ queryKey: rentalQueryKey });
      router.push(`/my/rental-business/${reservation.id}`);
    },
    onError: () => {
      returnOptions.refetch();
      officeHours.refetch();
    },
  });

  const selectedClub = clubs.data?.find(club => club.id === clubId);
  const selectedItem = items.data?.find(item => item.id === itemId);
  const pickup = returnOptions.data?.pickup;
  const returnSlot = returnOptions.data?.options.find(
    option => option.date === returnDate && option.availableQuantity > 0,
  );
  const pickupSlots = officeHours.data?.filter(
    slot => !slot.isClosed && new Date(slot.closesAt).getTime() > Date.now(),
  );
  const availableQuantity = returnSlot?.availableQuantity ?? 0;
  const dependsOnReturn =
    returnSlot && quantity > returnSlot.availableWithoutSameDayReturns;
  const canSubmit =
    selectedClub &&
    selectedItem &&
    pickup &&
    returnSlot &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity <= availableQuantity;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submit.isPending) return;
    const form = new FormData(event.currentTarget);
    const body = {
      clubId: selectedClub.id,
      itemId: selectedItem.id,
      quantity,
      pickup: { date: pickup.date, version: pickup.version },
      return: { date: returnSlot.date, version: returnSlot.version },
      contactPhoneNumber: String(form.get("phone") ?? "").trim(),
      purpose: String(form.get("purpose") ?? "").trim(),
    };
    const key = JSON.stringify(body);
    if (request.current?.key !== key) {
      request.current = { key, id: crypto.randomUUID() };
    }
    submit.mutate({ ...body, clientRequestId: request.current.id });
  };

  if (clubs.isPending || items.isPending || officeHours.isPending) {
    return <AsyncBoundary isLoading isError={false} />;
  }
  if (clubs.isError || items.isError || officeHours.isError) {
    return (
      <RentalError
        error={clubs.error ?? items.error ?? officeHours.error}
        fallback="신청에 필요한 정보를 불러오지 못했습니다."
        retry={() => {
          clubs.refetch();
          items.refetch();
          officeHours.refetch();
        }}
      />
    );
  }
  if (!clubs.data.length) {
    return (
      <Info text="현재 대표자 또는 대의원으로 등록된 동아리에서 신청할 수 있습니다." />
    );
  }
  if (!items.data.length || !pickupSlots?.length) {
    return <Info text="현재 신청할 수 있는 물품 또는 상근 일정이 없습니다." />;
  }

  return (
    <form onSubmit={onSubmit}>
      <Card outline gap={16}>
        <RentalFieldGrid>
          <RentalField>
            동아리
            <RentalSelect
              required
              value={clubId || ""}
              onChange={event => setClubId(Number(event.target.value))}
            >
              <option value="">동아리 선택</option>
              {clubs.data.map(club => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </RentalSelect>
          </RentalField>
          <RentalField>
            신청자
            <RentalInput readOnly value={applicant} />
          </RentalField>
        </RentalFieldGrid>
        <RentalField>
          물품
          <RentalSelect
            required
            value={itemId || ""}
            onChange={event => {
              setItemId(Number(event.target.value));
              setReturnDate("");
              setQuantity(1);
            }}
          >
            <option value="">물품 선택</option>
            {items.data.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </RentalSelect>
        </RentalField>
        {selectedItem && (
          <p>{rentalPolicyLabels[selectedItem.durationPolicy]}</p>
        )}
        <RentalFieldGrid>
          <RentalField>
            수령 상근일
            <RentalSelect
              required
              disabled={!itemId}
              value={pickupDate}
              onChange={event => {
                setPickupDate(event.target.value);
                setReturnDate("");
                setQuantity(1);
              }}
            >
              <option value="">수령 일정 선택</option>
              {pickupSlots.map(slot => (
                <option key={slot.date} value={slot.date}>
                  {formatRentalSlot(slot)}
                </option>
              ))}
            </RentalSelect>
          </RentalField>
          <RentalField>
            반납 상근일
            <RentalSelect
              required
              disabled={!returnOptions.data}
              value={returnSlot?.date ?? ""}
              onChange={event => {
                setReturnDate(event.target.value);
                setQuantity(1);
              }}
            >
              <option value="">반납 일정 선택</option>
              {returnOptions.data?.options.map(option => (
                <option
                  key={option.date}
                  value={option.date}
                  disabled={option.availableQuantity === 0}
                >
                  {formatRentalSlot(option)} ·{" "}
                  {option.availableQuantity > 0
                    ? `최대 ${option.availableQuantity}개`
                    : "재고 없음"}
                </option>
              ))}
            </RentalSelect>
          </RentalField>
          <RentalField>
            수량
            <RentalInput
              required
              type="number"
              min={1}
              max={availableQuantity || undefined}
              disabled={!returnSlot}
              value={quantity || ""}
              onChange={event => setQuantity(Number(event.target.value))}
            />
          </RentalField>
        </RentalFieldGrid>
        {returnOptions.isLoading && <AsyncBoundary isLoading isError={false} />}
        {returnOptions.isError && (
          <RentalError
            error={returnOptions.error}
            fallback="반납 가능 일정을 불러오지 못했습니다."
            retry={() => returnOptions.refetch()}
          />
        )}
        {returnOptions.data &&
          !returnOptions.data.options.some(
            option => option.availableQuantity > 0,
          ) && (
            <Info text="선택한 수령일에 가능한 반납 일정과 재고가 없습니다. 수령일을 바꿔 주세요." />
          )}
        {dependsOnReturn && (
          <Info text="수령일에 같은 물품이 반납될 예정입니다. 집행부가 반납을 확인한 뒤 수령할 수 있습니다." />
        )}
        <RentalField>
          연락처
          <RentalInput
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="010-1234-5678"
            pattern="010-[0-9]{4}-[0-9]{4}"
            maxLength={13}
            required
          />
        </RentalField>
        <RentalField>
          사용 목적
          <RentalTextarea name="purpose" maxLength={500} required />
        </RentalField>
        {submit.isError && (
          <RentalError
            error={submit.error}
            fallback="대여 신청을 완료하지 못했습니다."
          />
        )}
        <RentalActions>
          <Button
            buttonType="submit"
            type={canSubmit && !submit.isPending ? "default" : "disabled"}
          >
            {submit.isPending ? "신청 중" : "대여 신청"}
          </Button>
        </RentalActions>
      </Card>
    </form>
  );
};

const RentalApplicationFrame = () => {
  const { profile } = useAuth();
  return (
    <FlexWrapper direction="column" gap={24}>
      <PageHead
        items={[{ name: "대여 사업", path: "/rental-business" }]}
        title="물품 대여"
      />
      <RentalActions>
        <RentalLink href="/office-hours">상근 일정 보기</RentalLink>
        <RentalLink href="/my/rental-business">내 대여 내역</RentalLink>
      </RentalActions>
      <RentalAuth>
        {profile && (
          <RentalApplicationForm
            key={profile.id}
            userId={profile.id}
            applicant={profile.name}
          />
        )}
      </RentalAuth>
    </FlexWrapper>
  );
};

export default RentalApplicationFrame;
