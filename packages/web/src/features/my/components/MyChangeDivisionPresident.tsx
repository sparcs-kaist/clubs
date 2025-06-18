import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import NotificationCard from "@sparcs-clubs/web/common/components/NotificationCard";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ChangeDivisionPresidentMessageContext,
  ChangeDivisionPresidentStatusEnum,
} from "@sparcs-clubs/web/constants/changeDivisionPresident";
import ChangeDivisionPresidentModalContent from "@sparcs-clubs/web/features/my/components/ChangeDivisionPresidentModalContent";

export type MyChangeDivisionPresidentStatusEnum =
  | ChangeDivisionPresidentStatusEnum.Requested
  | ChangeDivisionPresidentStatusEnum.Confirmed;

interface MyChangeDivisionPresidentProps {
  status: MyChangeDivisionPresidentStatusEnum;
  actingPresident?: boolean;
  prevPresident: string;
  newPresident: string;
  phoneNumber: string | undefined;
  divisionName: string;
}

const notificationStatus: Record<
  MyChangeDivisionPresidentStatusEnum,
  "Alert" | "Success"
> = {
  [ChangeDivisionPresidentStatusEnum.Requested]: "Alert",
  [ChangeDivisionPresidentStatusEnum.Confirmed]: "Success",
};

const MyChangeDivisionPresident: React.FC<MyChangeDivisionPresidentProps> = ({
  status = ChangeDivisionPresidentStatusEnum.Requested,
  actingPresident = false,
  prevPresident,
  newPresident,
  phoneNumber = "",
  divisionName,
}: MyChangeDivisionPresidentProps) => {
  const router = useRouter();
  const messageContext = new ChangeDivisionPresidentMessageContext({
    actingPresident,
    division: divisionName,
    status,
    page: "/my",
    change: [prevPresident, newPresident],
    isModal: false,
  });

  const buttonString =
    status === ChangeDivisionPresidentStatusEnum.Requested
      ? "클릭하여 더보기"
      : "분과 관리 페이지 바로가기";

  const openConfirmModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <ChangeDivisionPresidentModalContent
          actingPresident={actingPresident}
          phoneNumber={phoneNumber}
          change={[prevPresident, newPresident]}
          divisionName={divisionName}
          status={status}
          onClose={close}
        />
      </Modal>
    ));
  };

  const onClick =
    status === ChangeDivisionPresidentStatusEnum.Requested
      ? openConfirmModal
      : () => {
          router.push("/manage-division");
        };

  return (
    <NotificationCard
      status={notificationStatus[status]}
      header={messageContext.getHeader()}
    >
      <FlexWrapper gap={8} direction="column">
        <Typography fs={16} lh={24} style={{ whiteSpace: "pre-wrap" }}>
          {`${messageContext.getBody()}`}
        </Typography>
        <TextButton
          text={buttonString}
          color="GRAY"
          fw="REGULAR"
          onClick={onClick}
        />
      </FlexWrapper>
    </NotificationCard>
  );
};

export default MyChangeDivisionPresident;
