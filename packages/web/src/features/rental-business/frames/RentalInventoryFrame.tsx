import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import type { RentalItem } from "@clubs/interface/api/rental/v2";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import {
  RentalActions,
  RentalError,
  RentalField,
  RentalFieldGrid,
  RentalInput,
  RentalSelect,
} from "../components/RentalFields";
import {
  type RentalItemBody,
  rentalQueryKey,
  saveRentalItem,
  useExecutiveRentalItems,
} from "../services/rentalApi";
import { formatRentalDuration } from "../utils/rentalSchedule";
import { ExecutiveRentalPage } from "./ExecutiveRentalFrame";

const RentalInventory = ({ userId }: { userId: number }) => {
  const [editing, setEditing] = useState<RentalItem | "new" | null>(null);
  const items = useExecutiveRentalItems(userId);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ body, id }: { body: RentalItemBody; id?: number }) =>
      saveRentalItem(body, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rentalQueryKey });
      setEditing(null);
    },
  });
  const item = editing === "new" ? undefined : (editing ?? undefined);
  const edit = (next: RentalItem | "new" | null) => {
    mutation.reset();
    setEditing(next);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      id: item?.id,
      body: {
        name: String(form.get("name") ?? "").trim(),
        totalQuantity: Number(form.get("totalQuantity")),
        durationType: form.get("durationType") as RentalItem["durationType"],
        durationValue: Number(form.get("durationValue")),
        isActive: form.has("isActive"),
      },
    });
  };
  return (
    <>
      <RentalActions>
        <Button
          type={editing ? "disabled" : "default"}
          onClick={() => edit("new")}
        >
          물품 추가
        </Button>
      </RentalActions>
      {editing && (
        <form key={item?.id ?? "new"} onSubmit={submit}>
          <Card outline gap={16}>
            <h2>{item ? "물품 정보 수정" : "새 대여 물품"}</h2>
            <RentalFieldGrid>
              <RentalField>
                물품명
                <RentalInput
                  name="name"
                  defaultValue={item?.name}
                  required
                  maxLength={100}
                />
              </RentalField>
              <RentalField>
                보유 수량
                <RentalInput
                  name="totalQuantity"
                  type="number"
                  min={0}
                  max={1000000}
                  defaultValue={item?.totalQuantity ?? 1}
                  required
                />
              </RentalField>
              <RentalField>
                대여 기한 단위
                <RentalSelect
                  name="durationType"
                  defaultValue={item?.durationType ?? "OFFICE_HOURS"}
                >
                  <option value="DAYS">일수</option>
                  <option value="OFFICE_HOURS">상근 횟수</option>
                </RentalSelect>
              </RentalField>
              <RentalField>
                기본 대여 기한
                <RentalInput
                  name="durationValue"
                  type="number"
                  min={1}
                  max={4294967295}
                  step={1}
                  defaultValue={item?.durationValue ?? 2}
                  required
                />
              </RentalField>
            </RentalFieldGrid>
            <label htmlFor="rental-item-active">
              <input
                type="checkbox"
                id="rental-item-active"
                name="isActive"
                defaultChecked={item?.isActive ?? true}
              />{" "}
              신규 신청 받기
            </label>
            {mutation.isError && (
              <RentalError
                error={mutation.error}
                fallback="물품 정보를 저장하지 못했습니다."
              />
            )}
            <RentalActions>
              <Button
                buttonType="submit"
                type={mutation.isPending ? "disabled" : "default"}
              >
                {mutation.isPending ? "저장 중" : "저장"}
              </Button>
              <Button
                type={mutation.isPending ? "disabled" : "outlined"}
                onClick={() => edit(null)}
              >
                닫기
              </Button>
            </RentalActions>
          </Card>
        </form>
      )}
      {items.isPending && <AsyncBoundary isLoading isError={false} />}
      {items.isError && (
        <RentalError
          error={items.error}
          fallback="물품 목록을 불러오지 못했습니다."
          retry={() => items.refetch()}
        />
      )}
      {items.data?.length === 0 && <p>등록된 물품이 없습니다.</p>}
      {items.data?.map(current => (
        <Card outline key={current.id} padding="20px" gap={8}>
          <RentalActions>
            <Typography fw="MEDIUM" fs={18} lh={24}>
              {current.name}
            </Typography>
            <Tag color={current.isActive ? "GREEN" : "GRAY"}>
              {current.isActive ? "신청 가능" : "신규 신청 중지"}
            </Tag>
          </RentalActions>
          <p>
            보유 수량 {current.totalQuantity}개 ·{" "}
            {formatRentalDuration(current)}
          </p>
          <RentalActions>
            <Button
              type={editing ? "disabled" : "outlined"}
              onClick={() => edit(current)}
            >
              수정
            </Button>
          </RentalActions>
        </Card>
      ))}
    </>
  );
};

const RentalInventoryFrame = () => (
  <ExecutiveRentalPage title="대여 물품 관리">
    {userId => <RentalInventory key={userId} userId={userId} />}
  </ExecutiveRentalPage>
);

export default RentalInventoryFrame;
