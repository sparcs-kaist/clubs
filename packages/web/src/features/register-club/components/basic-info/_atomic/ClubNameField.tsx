import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Select, { SelectItem } from "@sparcs-clubs/web/common/components/Select";
import {
  notAllowKrRegx,
  regxErrorMessage,
} from "@sparcs-clubs/web/features/register-club/constants";
import {
  ClubRegistrationInfo,
  RegisterClubModel,
} from "@sparcs-clubs/web/features/register-club/types/registerClub";

interface ClubNameFieldProps {
  type: RegistrationTypeEnum;
  clubList?: ClubRegistrationInfo[];
  editMode?: boolean;
}

const ClubNameField: React.FC<ClubNameFieldProps> = ({
  type,
  clubList = [],
  editMode = false,
}) => {
  const { control, setValue, watch } = useFormContext<RegisterClubModel>();
  const formData = watch();

  const clubId = watch("clubId");
  const krName = watch("clubNameKr");
  const enName = watch("clubNameEn");

  /*  NOTE: 2025 봄학기만 일괄로 동아리명 영문을 입력받기 위해 잠시 주석처리 */
  // const [isCheckedClubName, setIsCheckedClubName] = useState(
  //   !(krName === undefined || krName === ""),
  // );

  const clubOptions = useMemo(
    () =>
      clubList?.map(
        data =>
          ({
            label: data.clubNameKr,
            value: data.id,
          }) as SelectItem<number>,
      ),
    [clubList],
  );

  useEffect(() => {
    console.log("formData changed:", formData);
  }, [formData]);

  useEffect(() => {
    if (type !== RegistrationTypeEnum.NewProvisional && clubId != null) {
      const clubInfo = clubList.find(club => club.id === clubId);
      setValue("clubNameKr", clubInfo?.clubNameKr ?? "");
      if (clubInfo && notAllowKrRegx.test(clubInfo.clubNameEn)) {
        setValue("clubNameEn", clubInfo?.clubNameEn ?? "");
      }
    }
  }, [clubId, clubList]);

  /*  NOTE: 2025 봄학기만 일괄로 동아리명 영문을 입력받기 위해 잠시 주석처리 */
  // useEffect(() => {
  //   if (clubList.length > 0 && !isCheckedClubName) {
  //     resetField("clubNameKr", { keepError: false });
  //     resetField("clubNameEn", { keepError: false });
  //     setValue("clubNameKr", "", { shouldValidate: true });
  //     setValue("clubNameEn", "", { shouldValidate: true });
  //   }
  // }, [clubList.length, isCheckedClubName]);

  if (type === RegistrationTypeEnum.NewProvisional) {
    return (
      <FlexWrapper direction="row" gap={32} style={{ width: "100%" }}>
        <FormController
          name="clubNameKr"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              value={krName}
              label="동아리명 (국문)"
              placeholder="국문 동아리명을 입력해주세요"
            />
          )}
        />
        <FormController
          name="clubNameEn"
          required
          control={control}
          rules={{
            validate: value =>
              notAllowKrRegx.test(value) ? undefined : regxErrorMessage,
          }}
          renderItem={props => (
            <TextInput
              {...props}
              value={enName}
              label="동아리명 (영문)"
              placeholder="영문 동아리명을 입력해주세요"
            />
          )}
        />
      </FlexWrapper>
    );
  }

  return (
    <>
      <FormController
        name="clubId"
        required
        control={control}
        renderItem={props => (
          <Select
            {...props}
            label="동아리명 (국문)"
            placeholder="동아리명을 선택해주세요"
            items={clubOptions}
            disabled={editMode}
          />
        )}
      />
      {/*  NOTE: 2025 봄학기만 일괄로 동아리명 영문을 입력받기 위해 잠시 주석처리 */}
      {/* <CheckboxOption
        optionText="동아리명을 변경하고 싶어요"
        checked={isCheckedClubName}
        onClick={() => {
          setIsCheckedClubName(!isCheckedClubName);
        }}
      /> */}
      <FlexWrapper direction="row" gap={32} style={{ width: "100%" }}>
        <FormController
          name="clubNameKr"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label="동아리명 (국문)"
              placeholder="국문 동아리명을 입력해주세요"
            />
          )}
        />
        <FormController
          name="clubNameEn"
          required
          defaultValue=""
          control={control}
          rules={{
            validate: value =>
              notAllowKrRegx.test(value) ? undefined : regxErrorMessage,
          }}
          renderItem={props => (
            <TextInput
              {...props}
              label="동아리명 (영문)"
              placeholder="영문 동아리명을 입력해주세요"
            />
          )}
        />
      </FlexWrapper>
    </>
  );
};

export default ClubNameField;
