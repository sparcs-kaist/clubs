import { useParams } from "next/navigation";
import { overlay } from "overlay-kit";
import React, { useState } from "react";
import styled from "styled-components";

import { IFundingCommentResponse } from "@clubs/interface/api/funding/type/funding.comment.type";
import { IFundingResponse } from "@clubs/interface/api/funding/type/funding.type";
import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import UnitInput from "@sparcs-clubs/web/common/components/Forms/UnitInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import { FundingTagList } from "@sparcs-clubs/web/constants/tableTagList";
import useExecutiveReviewFunding from "@sparcs-clubs/web/features/manage-club/funding/services/useExecutiveReviewFunding";
import { formatSlashDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

const FundingInputWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.lg}) {
    flex-direction: column;
    gap: 20px;
  }
`;

const ExecutiveFundingReviewSection: React.FC<{
  funding: IFundingResponse;
  comments: IFundingCommentResponse[];
}> = ({ funding, comments }) => {
  const { id } = useParams<{ id: string }>();
  const fundingId = Number(id);

  const { profile } = useAuth();

  const { mutate: reviewFunding } = useExecutiveReviewFunding(fundingId);
  const [reviewDetail, setReviewDetail] = useState("");
  const [approveAmount, setApproveAmount] = useState(
    funding.approvedAmount !== 0 ? funding.approvedAmount?.toString() : "",
  );

  const handleApprove = () => {
    reviewFunding(
      {
        approvedAmount: Number(approveAmount),
        fundingStatusEnum:
          Number(approveAmount) === funding.expenditureAmount
            ? FundingStatusEnum.Approved
            : FundingStatusEnum.Partial,
        content: reviewDetail,
      },
      {
        onSuccess: () => {
          setReviewDetail("");
          overlay.open(({ isOpen, close }) => (
            <Modal isOpen={isOpen}>
              <ConfirmModalContent onConfirm={close}>
                지원금 신청{" "}
                {Number(approveAmount) === funding.expenditureAmount
                  ? "승인"
                  : "부분 승인"}
                이 완료되었습니다.
              </ConfirmModalContent>
            </Modal>
          ));
        },
        onError: () => {
          overlay.open(({ isOpen, close }) => (
            <Modal isOpen={isOpen}>
              <ConfirmModalContent onConfirm={close}>
                지원금 신청{" "}
                {Number(approveAmount) === funding.expenditureAmount
                  ? "승인"
                  : "부분 승인"}
                에 실패했습니다.
              </ConfirmModalContent>
            </Modal>
          ));
        },
      },
    );
  };

  const handleCommittee = () => {
    reviewFunding(
      {
        approvedAmount: Number(approveAmount),
        fundingStatusEnum: FundingStatusEnum.Committee,
        content: reviewDetail,
      },
      {
        onSuccess: () => {
          setReviewDetail("");
          overlay.open(({ isOpen, close }) => (
            <Modal isOpen={isOpen}>
              <ConfirmModalContent onConfirm={close}>
                운영위원회 승인이 필요한 항목으로 검토가 완료되었습니다
              </ConfirmModalContent>
            </Modal>
          ));
        },
        onError: () => {
          overlay.open(({ isOpen, close }) => (
            <Modal isOpen={isOpen}>
              <ConfirmModalContent onConfirm={close}>
                검토 내용 저장에 실패하였습니다
              </ConfirmModalContent>
            </Modal>
          ));
        },
      },
    );
  };

  const handleReject = () => {
    reviewFunding(
      {
        approvedAmount: 0,
        fundingStatusEnum: FundingStatusEnum.Rejected,
        content: reviewDetail,
      },
      {
        onSuccess: () => {
          setReviewDetail("");
          setApproveAmount("");
        },
        onError: () => {
          overlay.open(({ isOpen, close }) => (
            <Modal isOpen={isOpen}>
              <ConfirmModalContent onConfirm={close}>
                지원금 신청 반려에 실패했습니다.
              </ConfirmModalContent>
            </Modal>
          ));
        },
      },
    );
  };

  if (profile?.type !== UserTypeEnum.Executive) {
    return null;
  }

  const availableToApprove: () => boolean = () => {
    if (Number(approveAmount) === 0) return false;
    if (Number(approveAmount) > funding.expenditureAmount) return false;
    if (
      funding.fundingStatusEnum !== FundingStatusEnum.Committee &&
      Number(approveAmount) === funding.approvedAmount
    )
      return false;
    if (Number(approveAmount) === funding.expenditureAmount) return true;
    if (reviewDetail === "") return false;
    return true;
  };

  const availableToCommittee: () => boolean = () => {
    if (Number(approveAmount) === 0) return false;
    if (Number(approveAmount) > funding.expenditureAmount) return false;
    if (
      funding.fundingStatusEnum === FundingStatusEnum.Committee &&
      Number(approveAmount) === funding.approvedAmount
    )
      return false;
    if (reviewDetail === "") return false;
    return true;
  };

  const filteredComments = comments.filter(
    comment => comment.content.trim() !== "",
  );

  return (
    <Card outline padding="32px" gap={20}>
      {filteredComments.length > 0 && (
        <FlexWrapper direction="column" gap={8}>
          {filteredComments.map((comment, index) => (
            <FlexWrapper direction="column" gap={4} key={`${index.toString()}`}>
              <Typography fs={14} lh={16} color="GRAY.600">
                {formatSlashDateTime(comment.createdAt)} •{" "}
                {getTagDetail(comment.fundingStatusEnum, FundingTagList).text}
              </Typography>
              <Typography fs={16} lh={24}>
                {comment.content}
              </Typography>
            </FlexWrapper>
          ))}
        </FlexWrapper>
      )}

      <TextInput
        label="코멘트 (부분 승인 / 반려 / 운위 상정 시에는 필수)"
        value={reviewDetail}
        handleChange={setReviewDetail}
        placeholder="내용"
        area
      />
      <FundingInputWrapper>
        <FlexWrapper
          direction="row"
          gap={16}
          style={{ height: "36px", flex: 1 }}
        >
          <Typography
            fs={16}
            lh={36}
            fw="MEDIUM"
            style={{ whiteSpace: "nowrap" }}
          >
            승인 금액
          </Typography>
          <UnitInput
            value={approveAmount}
            handleChange={setApproveAmount}
            unit={`/ ${funding.expenditureAmount}원`}
            placeholder="금액을 입력해주세요"
            required={false}
            unitOnClick={() =>
              setApproveAmount(funding.expenditureAmount.toString())
            }
          />
        </FlexWrapper>
        <FlexWrapper
          direction="row"
          gap={16}
          style={{ height: "36px", justifyContent: "flex-end" }}
        >
          <Button
            type={availableToApprove() ? "default" : "disabled"}
            onClick={handleApprove}
          >
            신청 승인
          </Button>
          <Button
            onClick={handleReject}
            type={reviewDetail === "" ? "disabled" : "default"}
          >
            신청 반려
          </Button>
          <Button
            type={availableToCommittee() ? "default" : "disabled"}
            onClick={handleCommittee}
          >
            운위 상정
          </Button>
        </FlexWrapper>
      </FundingInputWrapper>
    </Card>
  );
};

export default ExecutiveFundingReviewSection;
