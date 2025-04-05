"use client";

import { Divider } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useCallback, useState } from "react";

import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import Toggle from "@sparcs-clubs/web/common/components/Toggle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import RegisterInfoTable from "@sparcs-clubs/web/features/executive/register-member/components/RegisterInfoTable";
import StatusInfoFrame from "@sparcs-clubs/web/features/executive/register-member/components/StatusInfoFrame";
import { useGetRegisterMemberDetail } from "@sparcs-clubs/web/features/executive/register-member/services/useGetRegisterMemberDetail";

const defaultStatusInfo = {
  status: RegistrationApplicationStudentStatusEnum.Pending,
  regular: 0,
  nonRegular: 0,
  total: 0,
};

const ExecutiveRegisterMemberDetail: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { id } = useParams<{ id: string }>();
  const clubId = parseInt(id);

  const club = useGetClubDetail(id as string);
  const { data, isLoading, isError } = useGetRegisterMemberDetail({
    clubId,
    pageOffset: currentPage,
    itemCount: limit,
  });

  const getStatusInfo = useCallback(
    (status?: RegistrationApplicationStudentStatusEnum) => {
      if (!data) {
        return defaultStatusInfo;
      }

      switch (status) {
        case RegistrationApplicationStudentStatusEnum.Pending:
          return {
            status,
            regular: data.regularMemberWaitings,
            nonRegular: data.totalWaitings - data.regularMemberWaitings,
            total: data.totalWaitings,
          };
        case RegistrationApplicationStudentStatusEnum.Approved:
          return {
            status,
            regular: data.regularMemberApprovals,
            nonRegular: data.totalApprovals - data.regularMemberApprovals,
            total: data.totalApprovals,
          };
        case RegistrationApplicationStudentStatusEnum.Rejected:
          return {
            status,
            regular: data.regularMemberRejections,
            nonRegular: data.totalRejections - data.regularMemberRejections,
            total: data.totalRejections,
          };

        default:
          return {
            status: RegistrationApplicationStudentStatusEnum.Pending,
            regular: data.regularMemberRegistrations,
            nonRegular:
              data.totalRegistrations - data.regularMemberRegistrations,
            total: data.totalRegistrations,
          };
      }
    },
    [data],
  );

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
          title={`회원 등록 신청 내역 (${club.data?.nameKr ?? ""})`}
        />
        <Card gap={16} padding="16px">
          <Toggle label={<Typography>회원 등록 신청 통계</Typography>}>
            <StatusInfoFrame
              statusInfo={getStatusInfo(
                RegistrationApplicationStudentStatusEnum.Pending,
              )}
            />
            <StatusInfoFrame
              statusInfo={getStatusInfo(
                RegistrationApplicationStudentStatusEnum.Approved,
              )}
            />
            <FlexWrapper gap={8} direction="column">
              <StatusInfoFrame
                statusInfo={getStatusInfo(
                  RegistrationApplicationStudentStatusEnum.Rejected,
                )}
              />
              <Divider style={{ marginLeft: 28 }} />
              <StatusInfoFrame statusInfo={getStatusInfo()} isTotal />
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
