import { useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import { useMyRentalOrders } from "../services/rentalApi";
import { RentalError, RentalLink } from "./RentalFields";
import { RentalReservationSummary } from "./RentalReservationSummary";

const itemCount = 10;

const ClubRentalList = ({
  clubId,
  userId,
}: {
  clubId: number;
  userId: number;
}) => {
  const [page, setPage] = useState(1);
  const orders = useMyRentalOrders(userId, {
    clubId,
    pageOffset: page,
    itemCount,
  });
  if (orders.isPending) return <AsyncBoundary isLoading isError={false} />;
  if (orders.isError) {
    return (
      <RentalError
        error={orders.error}
        fallback="동아리 대여 신청 내역을 불러오지 못했습니다."
        retry={() => orders.refetch()}
      />
    );
  }
  return (
    <FlexWrapper direction="column" gap={16}>
      {orders.data.items.length === 0 && (
        <p>동아리 대여 신청 내역이 없습니다.</p>
      )}
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
    </FlexWrapper>
  );
};

const ClubRentalOrders = ({ clubId }: { clubId: number }) => {
  const { profile } = useAuth();
  if (!profile) return <AsyncBoundary isLoading isError={false} />;
  return (
    <ClubRentalList
      key={`${profile.id}-${clubId}`}
      clubId={clubId}
      userId={profile.id}
    />
  );
};

export default ClubRentalOrders;
