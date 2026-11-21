import type {
  RentalReservation,
  RentalStatus,
} from "@clubs/interface/api/rental/v2";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Info from "@sparcs-clubs/web/common/components/Info";
import Tag, { type TagColor } from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { formatRentalSlot } from "../utils/rentalSchedule";
import { RentalActions } from "./RentalFields";

export const rentalStatusLabels: Record<RentalStatus, string> = {
  RESERVED: "예약 확정",
  CHECKED_OUT: "대여 중",
  RETURNED: "반납 완료",
  CANCELLED: "취소",
  REJECTED: "반려",
};

const statusColors: Record<RentalStatus, TagColor> = {
  RESERVED: "BLUE",
  CHECKED_OUT: "PURPLE",
  RETURNED: "GREEN",
  CANCELLED: "GRAY",
  REJECTED: "RED",
};

export const RentalReservationSummary = ({
  order,
}: {
  order: RentalReservation;
}) => (
  <FlexWrapper direction="column" gap={8}>
    <RentalActions>
      <Typography fw="MEDIUM" fs={18} lh={24}>
        {order.itemName} {order.quantity}개
      </Typography>
      <Tag color={statusColors[order.status]}>
        {rentalStatusLabels[order.status]}
      </Tag>
      {order.overdue && <Tag color="RED">연체</Tag>}
      {order.needsReschedule && <Tag color="ORANGE">일정 조정 필요</Tag>}
      {order.waitingForReturn && <Tag color="ORANGE">반납 확인 대기</Tag>}
    </RentalActions>
    <div>{order.clubName}</div>
    <div>수령 {formatRentalSlot(order.pickup)}</div>
    <div>반납 {formatRentalSlot(order.return)}</div>
  </FlexWrapper>
);

export const RentalReservationNotices = ({
  order,
}: {
  order: RentalReservation;
}) => (
  <>
    {order.needsReschedule && (
      <Info text="수령 또는 반납 일정을 조정해야 합니다. 새 일정은 동아리연합회 집행부에 문의해 주세요." />
    )}
    {order.overdue && (
      <Info text="예정된 반납 시간이 지났습니다. 다음 반납 가능 일정은 동아리연합회 집행부에 문의해 주세요." />
    )}
    {order.status === "RESERVED" && order.requiresSameDayReturn && (
      <Info text="수령일에 같은 물품이 반납될 예정입니다. 집행부가 반납을 확인한 뒤 수령할 수 있습니다." />
    )}
    {order.waitingForReturn && !order.requiresSameDayReturn && (
      <Info text="앞선 대여의 반납 확인을 기다리고 있습니다. 수령 가능 여부는 동아리연합회 집행부에 문의해 주세요." />
    )}
    {(order.status === "RESERVED" || order.status === "CHECKED_OUT") &&
      order.hasDependentPickup && (
        <Info text="이 물품의 반납일에 다음 대여가 예정되어 있습니다. 상근 시작 시간에 맞춰 반납해 주세요." />
      )}
    {order.closeReason && <p>처리 사유 {order.closeReason}</p>}
  </>
);
