import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import NotificationCard from "@sparcs-clubs/web/common/components/NotificationCard";

import Typography from "@sparcs-clubs/web/common/components/Typography";

interface ChangeDivisionPresidentProps {
  status: "Requested" | "Canceled" | "Rejected";
  actingPresident: boolean;
  change?: [string, string];
}

const ChangeDivisionPresident: React.FC<ChangeDivisionPresidentProps> = ({
  status = "Requested",
  actingPresident = true,
  change = undefined,
}: ChangeDivisionPresidentProps) => {
  const notificationStatus = status === "Rejected" ? "Error" : "Success";

  const getStatusString = () => {
    switch (status) {
      case "Requested":
        return "완료";
      case "Canceled":
        return "취소";
      case "Rejected":
        return "거절";
      default:
        return "error";
    }
  };

  const pronounString = actingPresident ? "학생회장 권한대행" : "학생회장";
  const divisionString = "'생활체육' 분과";
  const fullPronounString = `${divisionString}의 ${pronounString}`;
  const changeString =
    change === undefined ? "error" : `${change[0]} ⭢ ${change[1]}`;
  const requestNotice = `${pronounString} 변경 요청을 취소할 수 있으며, 요청이 3일 내로 승인 또는 거절되지 않을 경우 자동으로 취소됩니다`;

  const headerString = `분과 ${pronounString} 변경 요청 ${getStatusString()}`;
  const getBodyString = () => {
    switch (status) {
      case "Requested":
        return `${fullPronounString} 변경이 다음과 같이 요청되었습니다: ${changeString}`;
      case "Canceled":
        return `${fullPronounString} 변경이 취소되었습니다`;
      case "Rejected":
        return `${fullPronounString} 변경 요청이 거절되었습니다: ${changeString}`;
      default:
        return "error";
    }
  };

  return (
    <NotificationCard status={notificationStatus} header={headerString}>
      <FlexWrapper gap={8} direction="column">
        <Typography fs={16} lh={24}>
          {getBodyString()}
        </Typography>
        {status === "Requested" && (
          <Typography fs={16} lh={24}>
            {requestNotice}
          </Typography>
        )}
      </FlexWrapper>
    </NotificationCard>
  );
};

export default ChangeDivisionPresident;
