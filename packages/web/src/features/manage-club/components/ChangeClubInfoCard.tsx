import { overlay } from "overlay-kit";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { ApiClb004ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb004";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useGetClubInfo } from "@sparcs-clubs/web/features/manage-club/services/getClubInfo";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";
import { usePutClubInfo } from "@sparcs-clubs/web/features/manage-club/services/updateClubInfo";

interface MyManageClubData {
  clubId: number;
  delegateEnumId: number;
}

const ChangeClubInfoCard = () => {
  const { data: idData, isLoading: idIsLoading } = useGetMyManageClub() as {
    data: MyManageClubData;
    isLoading: boolean;
  };
  const [clubId, setClubId] = useState<number>(0);
  const { data, isLoading, isError, refetch } = useGetClubInfo({
    clubId,
  });

  // 동아리방 비밀번호 변경 미구현으로 임시 주석처리
  // const isRoomPasswordRequired = true; // TODO: 동방 없는 곳은 비밀번호 입력 안 해도 에러 안 뜨게 수정

  const formCtx = useForm<ApiClb004ResponseOK>({
    mode: "all",
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = formCtx;

  const { mutate: updateClubInfo } = usePutClubInfo();

  const description = watch("description");
  const roomPassword = watch("roomPassword");

  useEffect(() => {
    if (!idIsLoading && idData && Object.keys(idData).length > 0) {
      setClubId(idData.clubId);
      if (clubId && !isLoading && data) {
        if (data.description) setValue("description", data.description);
        if (data.roomPassword) setValue("roomPassword", data.roomPassword);
      }
    }
  }, [idIsLoading, idData, isLoading, clubId, data, setValue]);

  const handleSave = useCallback(() => {
    updateClubInfo(
      {
        requestParam: { clubId },
        body: {
          description,
          roomPassword,
        },
      },
      {
        onSuccess: () => {
          overlay.open(({ isOpen, close }) => (
            <Modal isOpen={isOpen}>
              <ConfirmModalContent
                onConfirm={() => {
                  close();
                }}
              >
                저장이 완료되었습니다.
              </ConfirmModalContent>
            </Modal>
          ));
          refetch();
        },
      },
    );
  }, [clubId, description, roomPassword, refetch, updateClubInfo]);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FormProvider {...formCtx}>
        <form onSubmit={handleSubmit(handleSave)} style={{ flex: 1 }}>
          <Card
            outline
            gap={32}
            style={{ flex: 1, height: "fit-content", width: "100%" }}
          >
            <Typography fw="MEDIUM" fs={20} lh={24}>
              기본 정보
            </Typography>
            <FormController
              name="description"
              required
              control={control}
              requiredMessage="동아리 설명을 입력하세요"
              renderItem={props => (
                <TextInput
                  {...props}
                  label="동아리 설명"
                  placeholder="동아리 설명을 입력하세요"
                  area
                />
              )}
            />
            {/* 동아리방 비밀번호 변경 미구현으로 임시 주석처리 */}
            {/* <FormController
              name="roomPassword"
              required={isRoomPasswordRequired}
              control={control}
              requiredMessage="동아리방 비밀번호를 입력하세요"
              renderItem={props => (
                <TextInput
                  {...props}
                  label="동아리방 비밀번호"
                  placeholder="동아리방 비밀번호를 입력하세요"
                />
              )}
            /> */}
            <Button
              buttonType="submit"
              type={isValid ? "default" : "disabled"}
              onClick={handleSave}
            >
              저장
            </Button>
          </Card>
        </form>
      </FormProvider>
    </AsyncBoundary>
  );
};

export default ChangeClubInfoCard;
