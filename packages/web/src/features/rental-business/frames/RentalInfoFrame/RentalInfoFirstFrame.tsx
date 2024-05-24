"use client";

import React, { useEffect, useState } from "react";
import Card from "@sparcs-clubs/web/common/components/Card";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import PhoneInput from "@sparcs-clubs/web/common/components/Forms/PhoneInput";
import useGetUserProfile from "@sparcs-clubs/web/features/printing-business/service/getUserProfile";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Select, {
  SelectItem,
} from "@sparcs-clubs/web/common/components/Forms/Select";
import { RentalFrameProps } from "../RentalNoticeFrame";

const RentalInfoFirstFrame: React.FC<
  RentalFrameProps & { setNextEnabled: (enabled: boolean) => void }
> = ({ setNextEnabled, rental, setRental }) => {
  const { data, isLoading, isError } = useGetUserProfile();

  const [clubList, setClubList] = useState<SelectItem[]>([]);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState<string | undefined>();

  useEffect(() => {
    if (data) {
      setClubList(
        data.clubs.map(club => ({
          label: club.name,
          value: String(club.id),
          selectable: true,
        })),
      );
      setUserName(data.name);
      setUserPhone(data?.phoneNumber);
      setUserPhone(rental.info?.phone ?? data.phoneNumber);
    }
  }, [data, rental.info?.phone]);

  const [phone, setPhone] = useState(rental.info?.phone ?? userPhone);
  const [hasPhoneError, setHasPhoneError] = useState(false);
  const [selectedValue, setSelectedValue] = useState(rental.info?.clubId ?? "");
  const [hasSelectError, setHasSelectError] = useState(false);

  useEffect(() => {
    const allConditionsMet =
      Boolean(selectedValue) &&
      Boolean(phone) &&
      !hasPhoneError &&
      !hasSelectError;
    setNextEnabled(allConditionsMet);
  }, [selectedValue, phone, hasPhoneError, hasSelectError, setNextEnabled]);

  useEffect(() => {
    if (selectedValue !== "") {
      const selectClub = clubList.find(
        selectclub => selectclub.value === selectedValue,
      );
      if (!selectClub) {
        return;
      }
      setRental({
        ...rental,
        info: {
          clubId: Number(selectedValue),
          clubName: selectClub?.label,
          applicant: userName,
          phone: phone ?? "",
        },
      });
    }
  }, [selectedValue, phone, setRental]);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <Card outline gap={40}>
        <Select
          items={clubList}
          selectedValue={String(selectedValue)}
          onSelect={setSelectedValue}
          label="동아리 이름"
          setErrorStatus={setHasSelectError}
        />
        <TextInput label="신청자 이름" placeholder={userName} disabled />
        <PhoneInput
          label="신청자 전화번호"
          value={phone ?? ""}
          // TODO: interface 연결 후 기본 value가 제대로 로딩되지 않는 문제 수정
          onChange={setPhone}
          placeholder={userPhone ?? ""}
          setErrorStatus={setHasPhoneError}
        />
      </Card>
    </AsyncBoundary>
  );
};

export default RentalInfoFirstFrame;
