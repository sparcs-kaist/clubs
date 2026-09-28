import { useState } from "react";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Select from "@sparcs-clubs/web/common/components/Select";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { ChangeDivisionPresidentStatusEnum } from "@sparcs-clubs/web/constants/changeDivisionPresident";
import DivisionCard from "@sparcs-clubs/web/features/manage-division/components/_atomic/DivisionCard";
import ChangeDivisionPresident from "@sparcs-clubs/web/features/manage-division/components/ChangeDivisionPresident";

type ChangeNoticeStatusEnum =
  | typeof ChangeDivisionPresidentStatusEnum.Requested
  | typeof ChangeDivisionPresidentStatusEnum.Canceled
  | typeof ChangeDivisionPresidentStatusEnum.Rejected
  | typeof ChangeDivisionPresidentStatusEnum.None;

const ChangeDivisionPresidentCard = () => {
  const mockIsActingPresident = true;

  const mockPresidentCandidateList = [
    "20210227 박병찬",
    "20200510 이지윤",
    "20240503 이민욱",
  ];

  const mockPresident = "20210227 박병찬";

  const mockSendDivisionPresidentChangeRequest = () => {};

  const [hasChangeNotice, setHasChangeNotice] = useState<boolean>(false);
  const [isSelectDisabled, setIsSelectDisabled] = useState<boolean>(false);

  const [changeNoticeStatus, setChangeNoticeStatus] =
    useState<ChangeNoticeStatusEnum>(ChangeDivisionPresidentStatusEnum.None);
  const [changeFromTo, setChangeFromTo] = useState<
    [string, string] | undefined
  >(undefined);

  // TODO: Request, Cancel, Rejected 관련해서 api와 연결
  const onDivisionPresidentChangeRequested = (to: string) => {
    if (mockPresident === to) {
      return;
    }

    setHasChangeNotice(true);
    setIsSelectDisabled(true);
    setChangeNoticeStatus(ChangeDivisionPresidentStatusEnum.Requested);
    setChangeFromTo([mockPresident, to]);
    mockSendDivisionPresidentChangeRequest();
  };

  const onDivisionPresidentChangeCanceled = () => {
    setHasChangeNotice(true);
    setIsSelectDisabled(false);
    setChangeNoticeStatus(ChangeDivisionPresidentStatusEnum.Canceled);
  };

  const onDivisionPresidentChangeRejected = () => {
    setHasChangeNotice(true);
    setIsSelectDisabled(false);
    setChangeNoticeStatus(ChangeDivisionPresidentStatusEnum.Rejected);
  };

  return (
    <DivisionCard outline padding="32px" gap={32}>
      <FlexWrapper gap={16} direction="row">
        <Typography fw="MEDIUM" fs={20} lh={24} style={{ flex: 1 }}>
          분과 학생회장
        </Typography>
        {mockIsActingPresident && <Tag color="GRAY">권한대행 체계</Tag>}
      </FlexWrapper>
      {hasChangeNotice && (
        <ChangeDivisionPresident
          status={
            changeNoticeStatus as Exclude<
              ChangeNoticeStatusEnum,
              typeof ChangeDivisionPresidentStatusEnum.None
            >
          }
          actingPresident={mockIsActingPresident}
          change={changeFromTo}
        />
      )}
      <FlexWrapper gap={4} direction="column">
        <FlexWrapper gap={12} direction="row">
          <Typography fw="MEDIUM" fs={16} lh={24} style={{ flex: 1 }}>
            학생회장
          </Typography>
          {changeNoticeStatus ===
            ChangeDivisionPresidentStatusEnum.Requested && (
            <TextButton
              text={`학생회장 ${mockIsActingPresident ? "권한대행 " : ""}변경 요청 취소`}
              onClick={onDivisionPresidentChangeCanceled}
            />
          )}
        </FlexWrapper>
        <Select
          items={mockPresidentCandidateList.map((item, _) => ({
            value: item,
            label: item,
          }))}
          value={mockPresident}
          onChange={onDivisionPresidentChangeRequested}
          disabled={isSelectDisabled}
        />
        {changeNoticeStatus ===
          ChangeDivisionPresidentStatusEnum.Requested /* TODO: 거절되었는지 승인되었는지 api에서 불러오기  */ && (
          <TextButton
            text={`TODO: ${changeFromTo?.[1]}이 거절함`}
            onClick={onDivisionPresidentChangeRejected}
          />
        )}
      </FlexWrapper>
    </DivisionCard>
  );
};

export default ChangeDivisionPresidentCard;
