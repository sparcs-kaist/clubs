import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import styled from "styled-components";

import apiClb013 from "@clubs/interface/api/club/endpoint/apiClb013";
import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ChangeRepresentativeModalText } from "@sparcs-clubs/web/constants/changeRepresentative";
import { patchMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/patchMyDelegateRequest";

interface ChangeRepresentativeModalContentProps {
  needPhoneNumber: boolean;
  clubName: string;
  prevRepresentative: string;
  newRepresentative: string;
  phonePlaceholder?: string;
  onClose: () => void;
  requestId: number;
}

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const ChangeRepresentativeModalContent: React.FC<
  ChangeRepresentativeModalContentProps
> = ({
  needPhoneNumber,
  clubName,
  prevRepresentative,
  newRepresentative,
  phonePlaceholder = "010-XXXX-XXXX",
  onClose,
  requestId,
}) => {
  const [errorPhone, setErrorPhone] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>("");

  const queryClient = useQueryClient();

  const onConfirm = () => {
    patchMyDelegateRequest(
      { requestId },
      {
        phoneNumber: phone,
        clubDelegateChangeRequestStatusEnum:
          ClubDelegateChangeRequestStatusEnum.Approved,
      },
    );
    queryClient.invalidateQueries({
      queryKey: [apiClb013.url()],
    });
    onClose();
  };

  const onReject = () => {
    patchMyDelegateRequest(
      { requestId },
      {
        clubDelegateChangeRequestStatusEnum:
          ClubDelegateChangeRequestStatusEnum.Rejected,
      },
    );
    queryClient.invalidateQueries({
      queryKey: [apiClb013.url()],
    });
    onClose();
  };

  return (
    <FlexWrapper direction="column" gap={12}>
      <Typography
        fw="MEDIUM"
        fs={16}
        lh={28}
        style={{ whiteSpace: "pre-wrap", textAlign: "center" }}
      >
        {ChangeRepresentativeModalText(
          clubName,
          prevRepresentative,
          newRepresentative,
        )}
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

export default ChangeRepresentativeModalContent;
