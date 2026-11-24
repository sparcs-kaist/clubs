import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import apiUsr001 from "@clubs/interface/api/user/endpoint/apiUsr001";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import FormError from "@sparcs-clubs/web/common/components/FormError";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import useUserPhoneNumber from "@sparcs-clubs/web/common/services/getUserPhoneNumber";
import patchMyPhoneNumber from "@sparcs-clubs/web/features/my/services/usePatchMyPhoneNumber";

const MyInfoFrame: React.FC<{ profile: string }> = ({ profile }) => {
  const t = useTranslations("my.overview");
  const queryClient = useQueryClient();
  const { profile: activeProfile } = useAuth();
  const {
    data: myInfo,
    isLoading: infoLoading,
    isError: infoError,
    refetch,
  } = useUserPhoneNumber(activeProfile?.id);

  const [editedPhone, setEditedPhone] = useState<string>();
  const myPhone = myInfo?.phoneNumber ?? "";
  const phone = editedPhone ?? myPhone;
  const { mutate, isPending, isError, isSuccess, reset } = useMutation({
    mutationFn: patchMyPhoneNumber,
    onSuccess: async () => {
      const [result] = await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: [apiUsr001.url()] }),
      ]);
      if (result.isSuccess) setEditedPhone(undefined);
    },
  });
  const canSave =
    !!activeProfile &&
    phone !== myPhone &&
    zKrPhoneNumber.safeParse(phone).success &&
    !isPending;

  return (
    <FoldableSectionTitle title={t("myInformation")}>
      <AsyncBoundary
        isLoading={infoLoading}
        isError={infoError && myInfo === undefined}
        renderIfError={
          <FlexWrapper
            direction="row"
            gap={12}
            style={{ alignItems: "center" }}
          >
            <div role="alert">
              <FormError>{t("phoneLoadError")}</FormError>
            </div>
            <Button type="outlined" onClick={() => refetch()}>
              {t("retryPhoneLoad")}
            </Button>
          </FlexWrapper>
        }
      >
        <Card outline gap={16} style={{ flex: 1 }}>
          <PhoneInput
            aria-label={t("phoneNumber")}
            label={t("phoneNumber")}
            placeholder="010-XXXX-XXXX"
            inputMode="tel"
            value={phone}
            formatDisplay={editedPhone !== undefined}
            onChange={value => {
              setEditedPhone(
                value.replace(/^(010)(\d{4})(\d{4})$/, "$1-$2-$3"),
              );
              reset();
            }}
            disabled={isPending}
          />
          {isError && (
            <div role="alert">
              <FormError>{t("phoneSaveError")}</FormError>
            </div>
          )}
          {isSuccess && (
            <div role="status">
              {t(infoError ? "phoneSavedReloadError" : "phoneSaved")}
            </div>
          )}
          <Button
            type={canSave ? "default" : "disabled"}
            style={{ width: "max-content", alignSelf: "flex-end" }}
            onClick={() => mutate({ phoneNumber: phone, profile })}
          >
            {t("save")}
          </Button>
        </Card>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default MyInfoFrame;
