import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React, { useMemo } from "react";
import styled from "styled-components";

import { FundingDeadlineEnum } from "@clubs/domain/semester/deadline";

import { FundingStatusEnum } from "@clubs/interface/common/enum/funding.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import { Profile } from "@sparcs-clubs/web/common/providers/AuthContext";
import { useDeleteFunding } from "@sparcs-clubs/web/features/manage-club/funding/services/useDeleteFunding";
import { useGetFunding } from "@sparcs-clubs/web/features/manage-club/funding/services/useGetFunding";
import useGetFundingDeadline from "@sparcs-clubs/web/features/manage-club/funding/services/useGetFundingDeadline";
import { newFundingListQueryKey } from "@sparcs-clubs/web/features/manage-club/funding/services/useGetNewFundingList";
import { isActivityReportUnverifiable } from "@sparcs-clubs/web/features/manage-club/funding/types/funding";

import BasicEvidenceList from "../components/BasicEvidenceList";
import ExecutiveFundingReviewSection from "../components/ExecutiveFundingReviewSection";
import FixtureEvidenceList from "../components/FixtureEvidenceList";
import FundingInfoList from "../components/FundingInfoList";
import FundingStatusSection from "../components/FundingStatusSection";
import NonCorpEvidenceList from "../components/NonCorpEvidenceList";
import OtherEvidenceList from "../components/OtherEvidenceList";
import TransportationEvidenceList from "../components/TransportationEvidenceList";

interface FundingDetailFrameProps {
  profile: Profile;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const FundingDetailFrame: React.FC<FundingDetailFrameProps> = ({ profile }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useGetFunding(profile.type, +id);
  const { mutate: deleteFunding } = useDeleteFunding();

  const {
    data: fundingDeadline,
    isLoading: isLoadingFundingDeadline,
    isError: isErrorFundingDeadline,
  } = useGetFundingDeadline();

  const navigateToFundingList = () => {
    if (profile.type === UserTypeEnum.Executive) {
      router.back();
    } else {
      router.push("/manage-club/funding");
    }
  };

  const openEditModal = () => {
    if (data?.funding.fundingStatusEnum === FundingStatusEnum.Applied) {
      router.push(`/manage-club/funding/${id}/edit`);
      return;
    }

    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            close();
            router.push(`/manage-club/funding/${id}/edit`);
          }}
          onClose={close}
        >
          지원금 신청 내역을 수정하면 신청 상태가 모두 초기화 됩니다.
          <br />
          수정하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  };

  const openDeleteModal = (clubId: number) => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            deleteFunding(
              { requestParam: { id: Number(id) } },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: newFundingListQueryKey(clubId),
                  });
                  close();
                  router.replace("/manage-club/funding");
                },
              },
            );
          }}
          onClose={close}
        >
          지원금 신청 내역을 삭제하면 복구할 수 없습니다.
          <br />
          삭제하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  };

  const isPastFunding = useMemo(() => {
    if (
      !fundingDeadline ||
      !fundingDeadline.targetDuration ||
      !data?.funding.expenditureDate
    ) {
      return false;
    }

    return (
      new Date(data.funding.expenditureDate) <
      new Date(fundingDeadline.targetDuration.startTerm)
    );
  }, [fundingDeadline, data?.funding.expenditureDate]);

  if (isError) {
    return <NotFound />;
  }

  if (!data?.funding) {
    return <AsyncBoundary isLoading={isLoading} isError={isError} />;
  }

  return (
    <FlexWrapper direction="column" gap={40}>
      <Card outline>
        <FundingStatusSection
          status={data.funding.fundingStatusEnum}
          editedAt={data.funding.editedAt}
          commentedAt={data.funding.commentedAt}
          comments={data.comments ?? []}
        />

        <AsyncBoundary isLoading={isLoading} isError={isError}>
          <FundingInfoList
            data={data.funding}
            isExecutive={profile.type === UserTypeEnum.Executive}
          />
          <BasicEvidenceList data={data.funding} />
          {(!data.funding.purposeActivity ||
            isActivityReportUnverifiable(data.funding.purposeActivity.id)) && (
            <FixtureEvidenceList data={data.funding} />
          )}
          {data.funding.isFixture && (
            <FixtureEvidenceList isFixture data={data.funding} />
          )}
          {data.funding.isTransportation && (
            <TransportationEvidenceList data={data.funding} />
          )}
          {data.funding.isNonCorporateTransaction && (
            <NonCorpEvidenceList data={data.funding} />
          )}
          {data.funding.isFoodExpense && (
            <OtherEvidenceList
              content="식비"
              explanation={data.funding.foodExpense?.explanation}
              fileList={data.funding.foodExpense?.files}
            />
          )}
          {data.funding.isLaborContract && (
            <OtherEvidenceList
              content="근로 계약"
              explanation={data.funding.laborContract?.explanation}
              fileList={data.funding.laborContract?.files}
            />
          )}
          {data.funding.isExternalEventParticipationFee && (
            <OtherEvidenceList
              content="외부 행사 참가비"
              explanation={
                data.funding.externalEventParticipationFee?.explanation
              }
              fileList={data.funding.externalEventParticipationFee?.files}
            />
          )}
          {data.funding.isPublication && (
            <OtherEvidenceList
              content="발간물"
              explanation={data.funding.publication?.explanation}
              fileList={data.funding.publication?.files}
            />
          )}
          {data.funding.isProfitMakingActivity && (
            <OtherEvidenceList
              content="수익 사업"
              explanation={data.funding.profitMakingActivity?.explanation}
              fileList={data.funding.profitMakingActivity?.files}
            />
          )}
          {data.funding.isJointExpense && (
            <OtherEvidenceList
              content="공동 경비"
              explanation={data.funding.jointExpense?.explanation}
              fileList={data.funding.jointExpense?.files}
            />
          )}
          {data.funding.isEtcExpense && (
            <OtherEvidenceList
              content="기타"
              explanation={data.funding.etcExpense?.explanation}
              fileList={data.funding.etcExpense?.files}
            />
          )}
        </AsyncBoundary>
      </Card>
      {profile.type === UserTypeEnum.Executive && !isPastFunding && (
        <ExecutiveFundingReviewSection
          funding={data.funding}
          comments={data.comments}
        />
      )}
      <ButtonWrapper>
        <Button type="default" onClick={navigateToFundingList}>
          목록으로 돌아가기
        </Button>
        <AsyncBoundary
          isLoading={isLoadingFundingDeadline}
          isError={isErrorFundingDeadline}
        >
          {!isPastFunding &&
            profile.type === UserTypeEnum.Undergraduate &&
            fundingDeadline?.deadline.deadlineEnum !==
              FundingDeadlineEnum.Exception && (
              <FlexWrapper direction="row" gap={10}>
                <Button
                  type="default"
                  onClick={() => openDeleteModal(data.funding.club.id)}
                >
                  삭제
                </Button>
                <Button type="default" onClick={openEditModal}>
                  수정
                </Button>
              </FlexWrapper>
            )}
        </AsyncBoundary>
      </ButtonWrapper>
    </FlexWrapper>
  );
};
export default FundingDetailFrame;
