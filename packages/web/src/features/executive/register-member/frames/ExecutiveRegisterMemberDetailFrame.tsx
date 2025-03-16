"use client";

import { Divider } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import Toggle from "@sparcs-clubs/web/common/components/Toggle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/getClubDetail";
import RegisterInfoTable from "@sparcs-clubs/web/features/executive/register-member/components/RegisterInfoTable";
import StatusInfoFrame from "@sparcs-clubs/web/features/executive/register-member/components/StatusInfoFrame";
import TotalInfoFrame from "@sparcs-clubs/web/features/executive/register-member/components/TotalInfoFrame";
import { useGetRegisterMemberDetail } from "@sparcs-clubs/web/features/executive/register-member/services/useGetRegisterMemberDetail";

const defaultStatusInfo = { Regular: 0, NonRegular: 0, Total: 0 };
function getStatusInfo(
  data: Awaited<ReturnType<typeof useGetRegisterMemberDetail>["data"]>,
  status: RegistrationApplicationStudentStatusEnum,
) {
  if (!data) {
    return { status, ...defaultStatusInfo };
  }

  switch (status) {
    case RegistrationApplicationStudentStatusEnum.Pending:
      return {
        status,
        Regular: data.regularMemberWaitings,
        NonRegular: data.totalWaitings - data.regularMemberWaitings,
        Total: data.totalWaitings,
      };
    case RegistrationApplicationStudentStatusEnum.Approved:
      return {
        status,
        Regular: data.regularMemberApprovals,
        NonRegular: data.totalApprovals - data.regularMemberApprovals,
        Total: data.totalApprovals,
      };
    case RegistrationApplicationStudentStatusEnum.Rejected:
      return {
        status,
        Regular: data.regularMemberRejections,
        NonRegular: data.totalRejections - data.regularMemberRejections,
        Total: data.totalRejections,
      };
    default:
      return { status, ...defaultStatusInfo };
  }
}

function getTotalStatusInfo(
  data: Awaited<ReturnType<typeof useGetRegisterMemberDetail>["data"]>,
) {
  if (!data) return defaultStatusInfo;
  return {
    Regular: data.regularMemberRegistrations,
    NonRegular: data.totalRegistrations - data.regularMemberRegistrations,
    Total: data.totalRegistrations,
  };
}

const ExecutiveRegisterMemberDetail = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { id } = useParams<{ id: string }>();
  const clubId = parseInt(id);

  const { data, isLoading, isError } = useGetRegisterMemberDetail({
    clubId,
    pageOffset: currentPage,
    itemCount: limit,
  });

  const club = useGetClubDetail(id as string);

  const pageTitle = useMemo(
    () => `회원 등록 신청 내역 (${club.data?.nameKr ?? ""})`,
    [club.data?.nameKr],
  );

  const pendingInfo = useMemo(
    () => getStatusInfo(data, RegistrationApplicationStudentStatusEnum.Pending),
    [data],
  );
  const approvedInfo = useMemo(
    () =>
      getStatusInfo(data, RegistrationApplicationStudentStatusEnum.Approved),
    [data],
  );
  const rejectedInfo = useMemo(
    () =>
      getStatusInfo(data, RegistrationApplicationStudentStatusEnum.Rejected),
    [data],
  );

  const totalInfo = useMemo(() => getTotalStatusInfo(data), [data]);

  const totalPage = data ? Math.ceil(data.total / limit) : 1;

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
          title={pageTitle}
        />
        <Card gap={16} padding="16px">
          <Toggle label={<Typography>회원 등록 신청 통계</Typography>}>
            <StatusInfoFrame {...pendingInfo} />
            <StatusInfoFrame {...approvedInfo} />
            <FlexWrapper gap={8} direction="column">
              <StatusInfoFrame {...rejectedInfo} />
              <Divider style={{ marginLeft: 28 }} />
              <TotalInfoFrame statusInfo={totalInfo} />
            </FlexWrapper>
          </Toggle>
        </Card>

        {data && <RegisterInfoTable memberRegisterInfoList={data} />}

        <FlexWrapper direction="row" gap={16} justify="center">
          <Pagination
            totalPage={totalPage}
            currentPage={currentPage}
            limit={limit}
            setPage={setCurrentPage}
          />
        </FlexWrapper>
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveRegisterMemberDetail;
