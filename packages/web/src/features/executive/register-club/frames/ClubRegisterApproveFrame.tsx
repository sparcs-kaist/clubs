import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import apiReg014 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg014";
import apiReg015 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg015";
import { RegistrationStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useRegisterClubDetail from "@sparcs-clubs/web/features/register-club/hooks/useGetRegisterClubDetail";
import { formatSlashDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";

import { patchClubRegistrationExecutive } from "../services/patchClubRegistrationExecutive";
import { postClubRegistrationSendBack } from "../services/postClubRegistrationSendBack";

const ClubRegisterApproveFrame = ({ applyId }: { applyId: number }) => {
  const queryClient = useQueryClient();

  const invalidateClubRegisterStatus = () => {
    queryClient.invalidateQueries({ queryKey: [apiReg014.url()] });
    queryClient.invalidateQueries({
      queryKey: [apiReg015.url(applyId.toString())],
    });
  };

  const [rejectionDetail, setRejectionDetail] = useState("");

  const { data, isLoading, isError } = useRegisterClubDetail("executive", {
    applyId,
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <Card gap={20} outline>
        {data && data.comments.length > 0 && (
          <FlexWrapper direction="column" gap={8}>
            {data.comments.map((comment, index) => (
              <FlexWrapper
                direction="column"
                gap={4}
                key={`${index.toString()}`}
              >
                <Typography fs={14} lh={16} color="GRAY.600">
                  {formatSlashDateTime(comment.createdAt)}
                </Typography>
                <Typography fs={16} lh={24}>
                  {comment.content}
                </Typography>
              </FlexWrapper>
            ))}
          </FlexWrapper>
        )}
        <FlexWrapper gap={4} direction="column">
          <Typography
            fs={16}
            lh={20}
            fw="MEDIUM"
            style={{ marginLeft: 2, marginRight: 2 }}
          >
            반려 사유 (반려 시에만 입력)
          </Typography>
          <TextInput
            value={rejectionDetail}
            handleChange={setRejectionDetail}
            placeholder="내용"
            area
          />
        </FlexWrapper>
        <FlexWrapper gap={16} direction="row" style={{ marginLeft: "auto" }}>
          <Button
            type={
              data?.registrationStatusEnumId !== RegistrationStatusEnum.Approved
                ? "default"
                : "disabled"
            }
            onClick={async () => {
              await patchClubRegistrationExecutive({ applyId });
              invalidateClubRegisterStatus();
            }}
          >
            신청 승인
          </Button>
          <Button
            type={rejectionDetail ? "default" : "disabled"}
            onClick={async () => {
              await postClubRegistrationSendBack(
                { applyId },
                { comment: rejectionDetail },
              );
              invalidateClubRegisterStatus();
              setRejectionDetail("");
            }}
          >
            신청 반려
          </Button>
        </FlexWrapper>
      </Card>
    </AsyncBoundary>
  );
};

export default ClubRegisterApproveFrame;
