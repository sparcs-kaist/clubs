import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
// import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";
import styled from "styled-components";

import apiDiv005 from "@clubs/interface/api/division/endpoint/apiDiv005";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  ChangeDivisionPresidentMessageContext,
  ChangeDivisionPresidentStatusEnum,
} from "@sparcs-clubs/web/constants/changeDivisionPresident";

interface ChangeDivisionPresidentModalContentProps {
  status:
    | ChangeDivisionPresidentStatusEnum.Requested
    | ChangeDivisionPresidentStatusEnum.Confirmed;
  actingPresident: boolean;
  change: [string, string];
  phoneNumber: string | undefined;
  divisionName: string;
  onClose: () => void;
}

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const ChangeDivisionPresidentModalContent: React.FC<
  ChangeDivisionPresidentModalContentProps
> = ({
  status,
  actingPresident,
  change,
  phoneNumber,
  divisionName,
  onClose,
}: ChangeDivisionPresidentModalContentProps) => {
  const messageContext = new ChangeDivisionPresidentMessageContext({
    actingPresident,
    division: divisionName,
    status,
    page: "/my",
    change,
    isModal: true,
  });

  const [errorPhone, setErrorPhone] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>("");

  const queryClient = useQueryClient();

  const onConfirm = () => {
    //TODO - ApiDiv006 POST 하기
    queryClient.invalidateQueries({
      queryKey: [apiDiv005.url()],
    });
    onClose();
  };

  const onReject = () => {
    //TODO - ApiDiv006 POST 하기
    queryClient.invalidateQueries({
      queryKey: [apiDiv005.url()],
    });
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
        {`${messageContext.getBody()}`}
      </Typography>
      {!phoneNumber && (
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
            placeholder={phoneNumber || "010-XXXX-XXXX"}
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
              !phoneNumber && (errorPhone || phone === "")
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
