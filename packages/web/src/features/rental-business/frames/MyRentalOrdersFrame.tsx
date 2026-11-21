import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import {
  RentalActions,
  RentalAuth,
  RentalError,
  RentalLink,
} from "../components/RentalFields";
import {
  RentalReservationNotices,
  RentalReservationSummary,
} from "../components/RentalReservationSummary";
import {
  cancelRental,
  rentalQueryKey,
  useMyRentalOrder,
  useMyRentalOrders,
} from "../services/rentalApi";
import { formatRentalInstant } from "../utils/rentalSchedule";

const itemCount = 12;

const MyOrders = ({ userId }: { userId: number }) => {
  const [page, setPage] = useState(1);
  const orders = useMyRentalOrders(userId, { pageOffset: page, itemCount });
  if (orders.isPending) return <AsyncBoundary isLoading isError={false} />;
  if (orders.isError) {
    return (
      <RentalError
        error={orders.error}
        fallback="대여 내역을 불러오지 못했습니다."
        retry={() => orders.refetch()}
      />
    );
  }
  return (
    <>
      {orders.data.items.length === 0 && <p>대여 내역이 없습니다.</p>}
      {orders.data.items.map(order => (
        <Card outline padding="20px" gap={12} key={order.id}>
          <RentalReservationSummary order={order} />
          <RentalLink href={`/my/rental-business/${order.id}`}>
            {order.itemName} 대여 상세 보기
          </RentalLink>
        </Card>
      ))}
      {orders.data.total > itemCount && (
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

const MyOrder = ({ userId, id }: { userId: number; id: number }) => {
  const order = useMyRentalOrder(userId, id);
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = useMutation({
    mutationFn: () => cancelRental(id),
    onSuccess: reservation => {
      queryClient.setQueryData(
        [...rentalQueryKey, "my-order", userId, id],
        reservation,
      );
      queryClient.invalidateQueries({ queryKey: rentalQueryKey });
      setConfirmCancel(false);
    },
    onError: () => order.refetch(),
  });
  if (order.isPending) return <AsyncBoundary isLoading isError={false} />;
  if (order.isError) {
    return (
      <RentalError
        error={order.error}
        fallback="대여 상세 내역을 불러오지 못했습니다."
        retry={() => order.refetch()}
      />
    );
  }
  const reservation = order.data;
  return (
    <Card outline gap={16}>
      <RentalReservationSummary order={reservation} />
      <p>신청 시각 {formatRentalInstant(reservation.createdAt)}</p>
      {reservation.checkedOutAt && (
        <p>수령 확인 {formatRentalInstant(reservation.checkedOutAt)}</p>
      )}
      {reservation.returnedAt && (
        <p>반납 확인 {formatRentalInstant(reservation.returnedAt)}</p>
      )}
      <RentalReservationNotices order={reservation} />
      {cancel.isError && (
        <RentalError
          error={cancel.error}
          fallback="예약을 취소하지 못했습니다."
        />
      )}
      {reservation.status === "RESERVED" && (
        <FlexWrapper direction="column" gap={8}>
          {confirmCancel && <p>이 대여 예약을 취소하시겠어요?</p>}
          <RentalActions>
            {confirmCancel ? (
              <>
                <Button
                  type={cancel.isPending ? "disabled" : "danger"}
                  onClick={() => cancel.mutate()}
                >
                  예약 취소 확인
                </Button>
                <Button
                  type={cancel.isPending ? "disabled" : "outlined"}
                  onClick={() => setConfirmCancel(false)}
                >
                  돌아가기
                </Button>
              </>
            ) : (
              <Button type="outlined" onClick={() => setConfirmCancel(true)}>
                예약 취소
              </Button>
            )}
          </RentalActions>
        </FlexWrapper>
      )}
    </Card>
  );
};

const myRentalPath = "/my/rental-business";

export const MyRentalOrdersFrame = () => {
  const { profile } = useAuth();
  return (
    <FlexWrapper direction="column" gap={16}>
      <PageHead
        items={[
          { name: "마이페이지", path: "/my" },
          { name: "내 대여 내역", path: myRentalPath },
        ]}
        title="내 대여 내역"
      />
      <RentalActions>
        <RentalLink href="/rental-business">물품 대여 신청</RentalLink>
        <RentalLink href="/office-hours">상근 일정 보기</RentalLink>
      </RentalActions>
      <RentalAuth>
        {profile && <MyOrders key={profile.id} userId={profile.id} />}
      </RentalAuth>
    </FlexWrapper>
  );
};

export const MyRentalOrderFrame = () => {
  const { profile } = useAuth();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return (
    <FlexWrapper direction="column" gap={16}>
      <PageHead
        items={[
          { name: "마이페이지", path: "/my" },
          { name: "내 대여 내역", path: myRentalPath },
        ]}
        title="대여 상세"
        enableLast
      />
      <RentalActions>
        <RentalLink href={myRentalPath}>내 대여 내역</RentalLink>
        <RentalLink href="/office-hours">상근 일정 보기</RentalLink>
      </RentalActions>
      <RentalAuth>
        {Number.isSafeInteger(id) && id > 0 ? (
          profile && (
            <MyOrder key={`${profile.id}-${id}`} userId={profile.id} id={id} />
          )
        ) : (
          <p>대여 내역을 찾을 수 없습니다.</p>
        )}
      </RentalAuth>
    </FlexWrapper>
  );
};
