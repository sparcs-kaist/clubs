"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import type { RentalStatus } from "@clubs/interface/api/rental/v2";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import ExecutiveRentalActionForm from "../components/ExecutiveRentalActionForm";
import {
  RentalActions,
  RentalAuth,
  RentalError,
  RentalField,
  RentalFieldGrid,
  RentalInput,
  RentalLink,
  RentalSelect,
} from "../components/RentalFields";
import {
  RentalReservationNotices,
  RentalReservationSummary,
  rentalStatusLabels,
} from "../components/RentalReservationSummary";
import {
  useExecutiveRentalOrder,
  useExecutiveRentalOrders,
} from "../services/rentalApi";
import {
  formatRentalDate,
  formatRentalInstant,
  todayRentalDate,
} from "../utils/rentalSchedule";

const executiveRentalsPath = "/executive/rental-business";
const itemCount = 12;

export const ExecutiveRentalPage = ({
  title,
  children,
}: {
  title: string;
  children: (userId: number) => ReactNode;
}) => {
  const { profile } = useAuth();
  return (
    <FlexWrapper direction="column" gap={16}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          { name: "물품 대여 관리", path: executiveRentalsPath },
        ]}
        title={title}
      />
      <RentalActions>
        {title !== "물품 대여 관리" && (
          <RentalLink href={executiveRentalsPath}>대여 내역</RentalLink>
        )}
        {title !== "대여 물품 관리" && (
          <RentalLink href={`${executiveRentalsPath}/items`}>
            대여 물품 관리
          </RentalLink>
        )}
        <RentalLink href="/executive/office-hours">상근 일정 관리</RentalLink>
      </RentalActions>
      <RentalAuth executive>{profile && children(profile.id)}</RentalAuth>
    </FlexWrapper>
  );
};

const ExecutiveOrders = ({ userId }: { userId: number }) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RentalStatus | "">("");
  const [overdue, setOverdue] = useState(false);
  const [officeDate, setOfficeDate] = useState("");
  const orders = useExecutiveRentalOrders(userId, {
    status: status || undefined,
    overdue: overdue ? "true" : undefined,
    officeDate: officeDate || undefined,
    pageOffset: page,
    itemCount,
  });

  return (
    <>
      <Card outline padding="20px" gap={12}>
        <RentalFieldGrid>
          <RentalField>
            상태
            <RentalSelect
              value={status}
              onChange={event => {
                setStatus(event.target.value as RentalStatus | "");
                setPage(1);
              }}
            >
              <option value="">전체 상태</option>
              {Object.entries(rentalStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </RentalSelect>
          </RentalField>
          <RentalField>
            수령·반납 상근일
            <RentalInput
              type="date"
              value={officeDate}
              onChange={event => {
                setOfficeDate(event.target.value);
                setPage(1);
              }}
            />
          </RentalField>
        </RentalFieldGrid>
        <RentalActions>
          <Button
            type="outlined"
            onClick={() => {
              setOfficeDate(todayRentalDate());
              setPage(1);
            }}
          >
            오늘 수령·반납
          </Button>
          <label htmlFor="rental-overdue-filter">
            <input
              id="rental-overdue-filter"
              type="checkbox"
              checked={overdue}
              onChange={event => {
                setOverdue(event.target.checked);
                setPage(1);
              }}
            />{" "}
            연체만 보기
          </label>
        </RentalActions>
      </Card>
      {orders.isPending && <AsyncBoundary isLoading isError={false} />}
      {orders.isError && (
        <RentalError
          error={orders.error}
          fallback="대여 내역을 불러오지 못했습니다."
          retry={() => orders.refetch()}
        />
      )}
      {orders.data?.items.length === 0 && (
        <p>해당 조건의 대여 내역이 없습니다.</p>
      )}
      {orders.data?.items.map(order => (
        <Card outline padding="20px" gap={12} key={order.id}>
          <RentalReservationSummary order={order} />
          <p>
            {order.studentName} · 신청 {formatRentalInstant(order.createdAt)}
          </p>
          <RentalActions>
            <RentalLink href={`${executiveRentalsPath}/${order.id}`}>
              {order.itemName} 대여 처리 및 상세
            </RentalLink>
            {(order.status === "RESERVED" ||
              order.status === "CHECKED_OUT") && (
              <Button
                type="outlined"
                aria-label={`${order.clubName} ${order.itemName} 대여 연장`}
                onClick={() =>
                  router.push(
                    `${executiveRentalsPath}/${order.id}?action=extend`,
                  )
                }
              >
                연장
              </Button>
            )}
          </RentalActions>
        </Card>
      ))}
      {orders.data && orders.data.total > itemCount && (
        <Pagination
          totalPage={Math.ceil(orders.data.total / itemCount)}
          currentPage={page}
          setPage={setPage}
          limit={10}
        />
      )}
    </>
  );
};

const ExecutiveOrder = ({
  userId,
  id,
  openExtension,
}: {
  userId: number;
  id: number;
  openExtension: boolean;
}) => {
  const query = useExecutiveRentalOrder(userId, id);
  if (query.isPending) return <AsyncBoundary isLoading isError={false} />;
  if (query.isError) {
    return (
      <RentalError
        error={query.error}
        fallback="대여 상세 내역을 불러오지 못했습니다."
        retry={() => query.refetch()}
      />
    );
  }
  const order = query.data;
  return (
    <Card outline gap={16}>
      <RentalReservationSummary order={order} />
      <FlexWrapper direction="column" gap={8}>
        <p>
          신청자 {order.studentName} ({order.studentNumber})
        </p>
        <p>연락처 {order.contactPhoneNumber}</p>
        <p>사용 목적 {order.purpose}</p>
        <p>신청 시각 {formatRentalInstant(order.createdAt)}</p>
        <p>기본 반납 기한 {formatRentalDate(order.regularReturnLimitDate)}</p>
        {order.checkedOutAt && (
          <p>
            수령 확인 {formatRentalInstant(order.checkedOutAt)} · 집행부 #
            {order.checkedOutByExecutiveId}
          </p>
        )}
        {order.checkoutMemo && <p>인계 메모 {order.checkoutMemo}</p>}
        {order.returnedAt && (
          <p>
            반납 확인 {formatRentalInstant(order.returnedAt)} · 집행부 #
            {order.returnedByExecutiveId}
          </p>
        )}
      </FlexWrapper>
      <RentalReservationNotices order={order} />
      {order.extensions.length > 0 && (
        <FlexWrapper direction="column" gap={8}>
          <h2>반납 연장 이력</h2>
          <ul>
            {order.extensions.map(extension => (
              <li key={`${extension.processedAt}-${extension.newReturnDate}`}>
                {formatRentalDate(extension.previousReturnDate)} →{" "}
                {formatRentalDate(extension.newReturnDate)} · {extension.reason}
                <br />
                {formatRentalInstant(extension.processedAt)} · 집행부 #
                {extension.processedByExecutiveId}
              </li>
            ))}
          </ul>
        </FlexWrapper>
      )}
      <ExecutiveRentalActionForm
        order={order}
        userId={userId}
        openExtension={openExtension}
      />
    </Card>
  );
};

export const ExecutiveRentalOrdersFrame = () => (
  <ExecutiveRentalPage title="물품 대여 관리">
    {userId => <ExecutiveOrders key={userId} userId={userId} />}
  </ExecutiveRentalPage>
);

export const ExecutiveRentalOrderFrame = ({
  id,
  openExtension,
}: {
  id: number;
  openExtension: boolean;
}) => (
  <ExecutiveRentalPage title="대여 처리 및 상세">
    {userId =>
      Number.isSafeInteger(id) && id > 0 ? (
        <ExecutiveOrder
          key={`${userId}-${id}-${openExtension}`}
          userId={userId}
          id={id}
          openExtension={openExtension}
        />
      ) : (
        <p>대여 내역을 찾을 수 없습니다.</p>
      )
    }
  </ExecutiveRentalPage>
);
