import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { z } from "zod";

import { apiOfh001 } from "@clubs/interface/api/office-hours";
import {
  apiRentalCancel,
  apiRentalCheckout,
  apiRentalCreate,
  apiRentalEligibleClubs,
  apiRentalExecutiveCancel,
  apiRentalExecutiveDetail,
  apiRentalExtend,
  apiRentalItemCreate,
  apiRentalItems,
  apiRentalItemsExecutive,
  apiRentalItemUpdate,
  apiRentalMyDetail,
  apiRentalReject,
  apiRentalReturn,
  apiRentalReturnOptions,
  apiRentalSchedule,
  apiRentalsExecutive,
  apiRentalsMy,
} from "@clubs/interface/api/rental/v2";

import { axiosClient, axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const rentalQueryKey = ["rental"] as const;

export const useRentalOfficeHours = (
  from: string,
  to: string,
  enabled = true,
) =>
  useQuery({
    queryKey: [...rentalQueryKey, "office-hours", from, to],
    enabled,
    queryFn: async () => {
      const { data } = await axiosClient.get(apiOfh001.url(), {
        params: { from, to },
      });
      return apiOfh001.responseBodyMap[200].parse(data).items;
    },
  });

export const useRentalItems = () =>
  useQuery({
    queryKey: [...rentalQueryKey, "items"],
    queryFn: async () => {
      const { data } = await axiosClient.get(apiRentalItems.url());
      return apiRentalItems.responseBodyMap[200].parse(data).items;
    },
  });

export const useRentalReturnOptions = (itemId: number, pickupDate: string) =>
  useQuery({
    queryKey: [...rentalQueryKey, "return-options", itemId, pickupDate],
    enabled: itemId > 0 && Boolean(pickupDate),
    queryFn: async () => {
      const { data } = await axiosClient.get(
        apiRentalReturnOptions.url(itemId),
        {
          params: { pickupDate },
        },
      );
      return apiRentalReturnOptions.responseBodyMap[200].parse(data);
    },
  });

export const useRentalEligibleClubs = (userId: number) =>
  useQuery({
    queryKey: [...rentalQueryKey, "eligible-clubs", userId],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(
        apiRentalEligibleClubs.url(),
      );
      return apiRentalEligibleClubs.responseBodyMap[200].parse(data).items;
    },
  });

export type RentalCreateBody = z.infer<typeof apiRentalCreate.requestBody>;

export const createRental = async (body: RentalCreateBody) => {
  const { data } = await axiosClientWithAuth.post(apiRentalCreate.url(), body);
  return apiRentalCreate.responseBodyMap[201].parse(data);
};

export type RentalListQuery = z.input<typeof apiRentalsMy.requestQuery>;

export const useMyRentalOrders = (userId: number, params: RentalListQuery) =>
  useQuery({
    queryKey: [...rentalQueryKey, "my-orders", userId, params],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(apiRentalsMy.url(), {
        params,
      });
      return apiRentalsMy.responseBodyMap[200].parse(data);
    },
  });

export const useMyRentalOrder = (userId: number, id: number) =>
  useQuery({
    queryKey: [...rentalQueryKey, "my-order", userId, id],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(apiRentalMyDetail.url(id));
      return apiRentalMyDetail.responseBodyMap[200].parse(data);
    },
  });

export const cancelRental = async (id: number) => {
  const { data } = await axiosClientWithAuth.post(apiRentalCancel.url(id), {});
  return apiRentalCancel.responseBodyMap[200].parse(data);
};

export type ExecutiveRentalListQuery = z.input<
  typeof apiRentalsExecutive.requestQuery
>;

export const useExecutiveRentalOrders = (
  userId: number,
  params: ExecutiveRentalListQuery,
) =>
  useQuery({
    queryKey: [...rentalQueryKey, "executive-orders", userId, params],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(
        apiRentalsExecutive.url(),
        {
          params,
        },
      );
      return apiRentalsExecutive.responseBodyMap[200].parse(data);
    },
  });

export const useExecutiveRentalOrder = (userId: number, id: number) =>
  useQuery({
    queryKey: [...rentalQueryKey, "executive-order", userId, id],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(
        apiRentalExecutiveDetail.url(id),
      );
      return apiRentalExecutiveDetail.responseBodyMap[200].parse(data);
    },
  });

export type ExecutiveRentalAction =
  | { name: "checkout"; body: z.infer<typeof apiRentalCheckout.requestBody> }
  | { name: "return"; body: z.infer<typeof apiRentalReturn.requestBody> }
  | {
      name: "cancel";
      body: z.infer<typeof apiRentalExecutiveCancel.requestBody>;
    }
  | { name: "reject"; body: z.infer<typeof apiRentalReject.requestBody> }
  | { name: "schedule"; body: z.infer<typeof apiRentalSchedule.requestBody> }
  | { name: "extend"; body: z.infer<typeof apiRentalExtend.requestBody> };

const executiveRentalActions = {
  checkout: apiRentalCheckout,
  return: apiRentalReturn,
  cancel: apiRentalExecutiveCancel,
  reject: apiRentalReject,
  schedule: apiRentalSchedule,
  extend: apiRentalExtend,
};

export const performExecutiveRentalAction = async (
  id: number,
  action: ExecutiveRentalAction,
) => {
  const api = executiveRentalActions[action.name];
  const { data } = await axiosClientWithAuth.request({
    url: api.url(id),
    method: api.method,
    data: action.body,
  });
  return api.responseBodyMap[200].parse(data);
};

export const useExecutiveRentalItems = (userId: number) =>
  useQuery({
    queryKey: [...rentalQueryKey, "executive-items", userId],
    queryFn: async () => {
      const { data } = await axiosClientWithAuth.get(
        apiRentalItemsExecutive.url(),
      );
      return apiRentalItemsExecutive.responseBodyMap[200].parse(data).items;
    },
  });

export type RentalItemBody = z.infer<typeof apiRentalItemCreate.requestBody>;

export const saveRentalItem = async (body: RentalItemBody, id?: number) => {
  if (id !== undefined) {
    const { data } = await axiosClientWithAuth.patch(
      apiRentalItemUpdate.url(id),
      body,
    );
    return apiRentalItemUpdate.responseBodyMap[200].parse(data);
  }
  const { data } = await axiosClientWithAuth.post(
    apiRentalItemCreate.url(),
    body,
  );
  return apiRentalItemCreate.responseBodyMap[201].parse(data);
};

export const getRentalErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) return fallback;
  const { response } = error;
  const message = response?.data?.message;
  const code = typeof message === "string" ? message : message?.message;
  switch (code) {
    case "OFFICE_HOURS_CHANGED":
    case "OFFICE_HOURS_NOT_PUBLISHED":
      return "상근 일정이 변경되었습니다. 최신 일정을 확인해 다시 선택해 주세요.";
    case "OFFICE_HOURS_PASSED":
    case "INVALID_PICKUP_DATE":
      return "이미 종료된 수령·반납 일정입니다. 이용 가능한 상근 일정을 선택해 주세요.";
    case "INVALID_RENTAL_PERIOD":
      return "물품의 기본 대여 기한에 맞는 반납일을 선택해 주세요.";
    case "INVALID_EXTENSION":
      return "기존 반납일보다 늦고 연장 가능한 상근일을 선택해 주세요.";
    case "OUT_OF_STOCK":
      return "선택한 일정의 재고가 부족합니다. 수량이나 일정을 다시 선택해 주세요.";
    case "WAITING_FOR_RETURN":
      return "아직 반납이 확인되지 않았습니다. 반납 확인 후 다시 시도해 주세요.";
    case "PICKUP_NOT_STARTED":
      return "아직 수령 상근이 시작되지 않았습니다. 수령 일정에 맞춰 확인해 주세요.";
    case "INVALID_RENTAL_STATE":
    case "PICKUP_ALREADY_CONFIRMED":
      return "대여 상태가 변경되었습니다. 최신 내역을 확인해 주세요.";
    case "STOCK_ALREADY_RESERVED":
      return "이미 예약했거나 대여 중인 수량이 있어 보유 수량을 줄일 수 없습니다.";
    case "REQUEST_ID_REUSED":
      return "이미 처리된 신청입니다. 내 대여 내역을 확인해 주세요.";
    default:
      break;
  }
  if (response?.status === 400)
    return `${fallback} 입력값과 상근 일정을 확인해 주세요.`;
  if (response?.status === 404) return "대여 내역이나 물품을 찾을 수 없습니다.";
  if (response?.status === 409) {
    return "재고, 상근 일정 또는 대여 상태가 변경되었습니다. 최신 정보를 확인해 다시 시도해 주세요.";
  }
  return fallback;
};
