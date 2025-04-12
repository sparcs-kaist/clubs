import React, { useMemo } from "react";
import styled from "styled-components";

import {
  MeetingEnum,
  MeetingStatusEnum,
} from "@clubs/interface/common/enum/meeting.enum";

import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { formatDotDate } from "@sparcs-clubs/web/utils/Date/formatDate";

import { isRegular, meetingType } from "../constants/meetingTemplate";
import { meetingEnumToText, MeetingNoticeItemType } from "../types/meeting";

interface MeetingNoticeItemProps {
  data: MeetingNoticeItemType;
  onClick?: VoidFunction;
}

const MeetingNoticeItemWrapper = styled.div`
  display: flex;
  padding: 8px;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex: 1;
  align-self: stretch;
  border-bottom: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  cursor: pointer;
`;

const TagWithTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const LogoWithTagAndTitleWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const DateWrapper = styled(Typography)<{ isDivisionMeeting: boolean }>`
  font-size: 16px;
  line-height: 24px;
  min-width: 85px;
  text-align: center;
  color: ${props =>
    props.isDivisionMeeting
      ? props.theme.colors.GRAY[300]
      : props.theme.colors.BLACK};
`;

const MeetingNoticeItem: React.FC<MeetingNoticeItemProps> = ({
  data,
  onClick = () => {},
}) => {
  const tagColor = () => {
    switch (data.meetingStatus) {
      case MeetingStatusEnum.Agenda:
        return "BLUE";
      case MeetingStatusEnum.Complete:
        return "GRAY";
      default:
        return "YELLOW";
    }
  };

  const tagText = () => {
    switch (data.meetingStatus) {
      case MeetingStatusEnum.Agenda:
        return "안건 공개";
      case MeetingStatusEnum.Complete:
        return "회의 종료";
      default:
        return "공고 게시";
    }
  };

  const meetingTitle = useMemo(() => {
    if (data == null) return "";
    let title = data.meetingTitle;

    title = title.replace(
      meetingType,
      meetingEnumToText(data.meetingEnumId.toString()),
    );
    title = title.replace(
      isRegular,
      data.isRegular ? "정기회의" : "비정기회의",
    );

    return title;
  }, [data]);

  const isDivisionMeeting = data.meetingEnumId === MeetingEnum.divisionMeeting;

  return (
    <MeetingNoticeItemWrapper onClick={onClick}>
      <LogoWithTagAndTitleWrapper>
        <TagWithTitleWrapper>
          <Tag color={tagColor()}>{tagText()}</Tag>
          <Typography
            fs={16}
            lh={24}
            fw="MEDIUM"
            style={{ textOverflow: "ellipsis", overflow: "hidden" }}
          >
            {meetingTitle}
          </Typography>
        </TagWithTitleWrapper>
      </LogoWithTagAndTitleWrapper>
      <DateWrapper isDivisionMeeting={isDivisionMeeting}>
        {isDivisionMeeting ? "(미정)" : formatDotDate(data.meetingDate)}
      </DateWrapper>
    </MeetingNoticeItemWrapper>
  );
};

export { MeetingNoticeItem };
