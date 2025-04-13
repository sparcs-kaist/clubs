import React, { useState } from "react";
// import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ChangeDivisionPresidentMessageContext,
  ChangeDivisionPresidentStatusEnum,
} from "@sparcs-clubs/web/constants/changeDivisionPresident";
// import { patchMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/patchMyDelegateRequest";

interface ChangeDivisionPresidentModalContentProps {
  needPhoneNumber: boolean;
  actingPresident: boolean;
  change: [string, string];
  phonePlaceholder?: string;
  onClose: () => void;
  fetch: () => void;
  onConfirmed: () => void;
  onRejected: () => void;
}

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const ChangeDivisionPresidentModalContent: React.FC<
  ChangeDivisionPresidentModalContentProps
> = ({
  needPhoneNumber,
  actingPresident,
  change,
  phonePlaceholder = "010-XXXX-XXXX",
  onClose,
  fetch,
  onConfirmed,
  onRejected,
}: ChangeDivisionPresidentModalContentProps) => {
  const messageContext = new ChangeDivisionPresidentMessageContext({
    actingPresident,
    division: "'생활체육' 분과",
    status: ChangeDivisionPresidentStatusEnum.Requested,
    page: "/my",
    change,
    isModal: true,
  });

  const [errorPhone, setErrorPhone] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>("");

  const onConfirm = () => {
    // patchMyDelegateRequest(
    //   { requestId: 1 },
    //   {
    //     phoneNumber: phone,
    //     clubDelegateChangeRequestStatusEnum:
    //       ClubDelegateChangeRequestStatusEnum.Rejected,
    //   },
    // );
    onConfirmed();
    onClose();
    fetch();
  };

  const onReject = () => {
    // patchMyDelegateRequest(
    //   { requestId: 1 },
    //   {
    //     clubDelegateChangeRequestStatusEnum:
    //       ClubDelegateChangeRequestStatusEnum.Rejected,
    //   },
    // );
    onRejected();
    onClose();
  };

  return (
    <FlexWrapper gap={12} direction="column">
      <Typography
        fw="MEDIUM"
        fs={16}
        lh={28}
        style={{ whiteSpace: "pre-wrap", textAlign: "center" }}
      >
        {messageContext.getBody()}
      </Typography>
      {needPhoneNumber && (
        <>
          <Typography
            fw="MEDIUM"
            fs={16}
            lh={28}
            style={{ whiteSpace: "pre-wrap", textAlign: "center" }}
          >
            전화번호를 입력해야 동아리 대표자 변경을 승인할 수 있습니다
          </Typography>
          <PhoneInput
            placeholder={phonePlaceholder}
            value={phone}
            onChange={setPhone}
            setErrorStatus={setErrorPhone}
          />
        </>
      )}
      <ButtonWrapper>
        <Button type="outlined" onClick={onClose}>
          취소
        </Button>
        <FlexWrapper direction="row" gap={12}>
          <Button type="outlined" onClick={onReject}>
            거절
          </Button>
          <Button
            type={
              needPhoneNumber && (errorPhone || phone === "")
                ? "disabled"
                : "default"
            }
            onClick={onConfirm}
          >
            승인
          </Button>
        </FlexWrapper>
      </ButtonWrapper>
    </FlexWrapper>
  );
};

export default ChangeDivisionPresidentModalContent;
