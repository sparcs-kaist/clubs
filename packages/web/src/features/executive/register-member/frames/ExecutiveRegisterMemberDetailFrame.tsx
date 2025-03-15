"use client";

import { Divider } from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import Toggle from "@sparcs-clubs/web/common/components/Toggle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import { mockupClubMemberRegister } from "@sparcs-clubs/web/features/executive/register-member/[id]/_mock/mockClubMemberRegister";
import { useGetRegisterMemberDetail } from "@sparcs-clubs/web/features/executive/register-member/[id]/services/getRegisterMemberDetail";
import RegisterInfoTable from "@sparcs-clubs/web/features/executive/register-member/components/RegisterInfoTable";
import StatusInfoFrame from "@sparcs-clubs/web/features/executive/register-member/components/StatusInfoFrame";
import TotalInfoFrame from "@sparcs-clubs/web/features/executive/register-member/components/TotalInfoFrame";

const ExecutiveRegisterMemberDetail = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { id } = useParams<{ id: string }>();
  const clubId = parseInt(id);

  const DividerContainer = styled.div`
    padding-left: 28px;
  `;

  const { data, isLoading, isError } = useGetRegisterMemberDetail({
    clubId,
    pageOffset: currentPage,
    itemCount: limit,
  });

  const paginatedData = data && {
    totalRegistrations: data.totalRegistrations,
    totalWaitings: data.totalWaitings,
    totalApprovals: data.totalApprovals,
    totalRejections: data.totalRejections,
    regularMemberRegistrations: data.regularMemberRegistrations,
    regularMemberWaitings: data.regularMemberWaitings,
    regularMemberApprovals: data.regularMemberApprovals,
    regularMemberRejections: data.regularMemberRejections,
    total: data.total,
    items: data.items.slice((currentPage - 1) * limit, currentPage * limit),
    offset: (currentPage - 1) * limit,
  };

  const pendingInfo = paginatedData && {
    Regular: paginatedData.regularMemberWaitings,
    NonRegular:
      paginatedData.totalWaitings - paginatedData.regularMemberWaitings,
    Total: paginatedData.totalWaitings,
  };

  const approvalInfo = paginatedData && {
    Regular: paginatedData.regularMemberApprovals,
    NonRegular:
      paginatedData.totalApprovals - paginatedData.regularMemberApprovals,
    Total: paginatedData.totalApprovals,
  };

  const rejectionInfo = paginatedData && {
    Regular: paginatedData.regularMemberRejections,
    NonRegular:
      paginatedData.totalRejections - paginatedData.regularMemberRejections,
    Total: paginatedData.totalRejections,
  };

  const totalInfo = paginatedData && {
    Regular: paginatedData.regularMemberRegistrations,
    NonRegular:
      paginatedData.totalRegistrations -
      paginatedData.regularMemberRegistrations,
    Total: paginatedData.totalRegistrations,
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const defaultStatusInfo = { Regular: 0, NonRegular: 0, Total: 0 };

  const club = useGetClubDetail(id as string);

  const GetPageTitle = () => `회원 등록 신청 내역 (${club.data?.nameKr})`;

  return (
    <AsyncBoundary
      isLoading={club.isLoading || isLoading}
      isError={club.isError || isError}
    >
      <FlexWrapper direction="column" gap={20}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            { name: "회원 등록 신청 내역", path: `/executive/register-member` },
          ]}
          enableLast
          title={GetPageTitle()}
        />
        <Card gap={16} padding="16px">
          <Toggle label={<Typography>회원 등록 신청 통계</Typography>}>
            <StatusInfoFrame
              statusInfo={pendingInfo || defaultStatusInfo}
              status={RegistrationApplicationStudentStatusEnum.Pending}
            />
            <StatusInfoFrame
              statusInfo={approvalInfo || defaultStatusInfo}
              status={RegistrationApplicationStudentStatusEnum.Approved}
            />
            <FlexWrapper gap={8} direction="column">
              <StatusInfoFrame
                statusInfo={rejectionInfo || defaultStatusInfo}
                status={RegistrationApplicationStudentStatusEnum.Rejected}
              />
              <DividerContainer>
                <Divider />
              </DividerContainer>
              <TotalInfoFrame statusInfo={totalInfo || defaultStatusInfo} />
            </FlexWrapper>
          </Toggle>
        </Card>
        {data && paginatedData && (
          <RegisterInfoTable memberRegisterInfoList={paginatedData} />
        )}
        <FlexWrapper direction="row" gap={16} justify="center">
          <Pagination
            totalPage={Math.ceil(mockupClubMemberRegister.total / limit)}
            currentPage={currentPage}
            limit={limit}
            setPage={handlePageChange}
          />
        </FlexWrapper>
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveRegisterMemberDetail;
