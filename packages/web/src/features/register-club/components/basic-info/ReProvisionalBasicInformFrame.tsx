import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useGetClubsForReProvisional from "@sparcs-clubs/web/features/register-club/services/useGetClubsForReProvisional";
import {
  ClubRegistrationInfo,
  RegisterClubModel,
} from "@sparcs-clubs/web/features/register-club/types/registerClub";

import ClubNameField from "./_atomic/ClubNameField";
import ProvisionalBasicInformFrame, {
  ProvisionalBasicInformFrameProps,
} from "./ProvisionalBasicInformFrame";

interface ReProvisionalBasicInformFrameProps extends Omit<
  ProvisionalBasicInformFrameProps,
  "children"
> {
  editMode?: boolean;
  existingClub?: ClubRegistrationInfo;
}

const ReProvisionalClubNameField = () => {
  const { data, isLoading, isError } = useGetClubsForReProvisional();
  const { watch, setValue } = useFormContext<RegisterClubModel>();
  const clubId = watch("clubId");

  useEffect(() => {
    if (!data || data.clubs.some(club => club.id === clubId)) return;
    const club = data.clubs.length === 1 ? data.clubs[0] : undefined;
    setValue("clubId", club?.id, { shouldValidate: true });
    setValue("clubNameKr", club?.clubNameKr ?? "", { shouldValidate: true });
    setValue("clubNameEn", club?.clubNameEn ?? "", { shouldValidate: true });
  }, [data, clubId, setValue]);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ClubNameField
        type={RegistrationTypeEnum.ReProvisional}
        clubList={data?.clubs}
      />
    </AsyncBoundary>
  );
};

const ReProvisionalBasicInformFrame = ({
  editMode = false,
  existingClub,
  ...props
}: ReProvisionalBasicInformFrameProps) => (
  <ProvisionalBasicInformFrame {...props}>
    {editMode ? (
      <ClubNameField
        type={RegistrationTypeEnum.ReProvisional}
        clubList={existingClub ? [existingClub] : []}
        editMode
      />
    ) : (
      <ReProvisionalClubNameField />
    )}
  </ProvisionalBasicInformFrame>
);

export default ReProvisionalBasicInformFrame;
