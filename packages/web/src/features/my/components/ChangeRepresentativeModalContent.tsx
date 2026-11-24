import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import styled from "styled-components";

import apiClb013 from "@clubs/interface/api/club/endpoint/apiClb013";
import type { ApiClb014RequestBody } from "@clubs/interface/api/club/endpoint/apiClb014";
import apiClb015 from "@clubs/interface/api/club/endpoint/apiClb015";
import apiUsr001 from "@clubs/interface/api/user/endpoint/apiUsr001";
import apiUsr002 from "@clubs/interface/api/user/endpoint/apiUsr002";
import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormError from "@sparcs-clubs/web/common/components/FormError";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import type { Profile } from "@sparcs-clubs/web/common/providers/AuthContext";
import useUserPhoneNumber from "@sparcs-clubs/web/common/services/getUserPhoneNumber";
import { patchMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/patchMyDelegateRequest";

interface ChangeRepresentativeModalContentProps {
  clubName: string;
  role: string;
  requester: string;
  onClose: () => void;
  profile: Profile;
  requestId: number;
}

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
`;

const ChangeRepresentativeModalContent: React.FC<
  ChangeRepresentativeModalContentProps
> = ({ clubName, role, requester, onClose, profile, requestId }) => {
  const t = useTranslations("my.representative");
  const queryClient = useQueryClient();
  const { data: savedPhone, isLoading: phoneLoading } = useUserPhoneNumber(
    profile.id,
  );
  const [editedPhone, setEditedPhone] = useState<string>();
  const phone = editedPhone ?? savedPhone?.phoneNumber ?? "";
  const isPhoneValid = zKrPhoneNumber.safeParse(phone).success;

  const { mutate, isError, isPending } = useMutation({
    mutationFn: (body: ApiClb014RequestBody) =>
      patchMyDelegateRequest({ requestId }, body),
    onSuccess: async (_, body) => {
      const keys = [apiClb013.url()];
      if (
        body.clubDelegateChangeRequestStatusEnum ===
        ClubDelegateChangeRequestStatusEnum.Approved
      ) {
        keys.push(apiUsr001.url(), apiUsr002.url(), apiClb015.url());
      }
      await Promise.all(
        keys.map(key => queryClient.invalidateQueries({ queryKey: [key] })),
      );
      onClose();
    },
    onError: () =>
      queryClient.invalidateQueries({ queryKey: [apiClb013.url()] }),
  });

  return (
    <FlexWrapper direction="column" gap={12}>
      <Typography
        fw="MEDIUM"
        fs={16}
        lh={28}
        style={{ whiteSpace: "pre-wrap" }}
      >
        {t("requestedBody", { clubName, role, requester })}
      </Typography>
      <PhoneInput
        aria-label={t("phoneNumber")}
        label={t("phoneNumber")}
        helperText={t("phoneRequired")}
        placeholder="010-XXXX-XXXX"
        value={phone}
        formatDisplay={editedPhone !== undefined}
        onChange={value =>
          setEditedPhone(value.replace(/^(010)(\d{4})(\d{4})$/, "$1-$2-$3"))
        }
        disabled={phoneLoading || isPending}
      />
      {isError && (
        <div role="alert">
          <FormError>{t("responseError")}</FormError>
        </div>
      )}
      <ButtonWrapper>
        <Button type={isPending ? "disabled" : "outlined"} onClick={onClose}>
          {t("cancel")}
        </Button>
        <FlexWrapper direction="row" gap={12}>
          <Button
            type={isPending ? "disabled" : "outlined"}
            onClick={() =>
              mutate({
                clubDelegateChangeRequestStatusEnum:
                  ClubDelegateChangeRequestStatusEnum.Rejected,
              })
            }
          >
            {t("reject")}
          </Button>
          <Button
            type={isPending || !isPhoneValid ? "disabled" : "default"}
            onClick={() =>
              mutate({
                phoneNumber: phone,
                clubDelegateChangeRequestStatusEnum:
                  ClubDelegateChangeRequestStatusEnum.Approved,
              })
            }
          >
            {t("approve")}
          </Button>
        </FlexWrapper>
      </ButtonWrapper>
    </FlexWrapper>
  );
};

export default ChangeRepresentativeModalContent;
