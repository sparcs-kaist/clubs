import { useState } from "react";
import styled from "styled-components";

import { ApiClb002ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb002";
import { ApiClb006ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb006";
import { ApiClb015ResponseOk } from "@sparcs-clubs/interface/api/club/endpoint/apiClb015";
import { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import MembersTable from "@sparcs-clubs/web/features/manage-club/components/MembersTable";
import { useGetMemberRegistration } from "@sparcs-clubs/web/features/manage-club/members/services/useGetClubMemberRegistration";
import { useGetClubDelegate } from "@sparcs-clubs/web/features/manage-club/services/getClubDelegate";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";

const TableWithPagination = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  align-self: stretch;
`;

const RegisterMemberList = () => {
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const { data: idData } = useGetMyManageClub() as {
    data: ApiClb015ResponseOk;
    isLoading: boolean;
  };

  const {
    data: delegatesNow,
    isLoading: delegatesIsLoading,
    isError: delegatesIsError,
  } = useGetClubDelegate({ clubId: idData.clubId }) as {
    data: ApiClb006ResponseOK;
    isLoading: boolean;
    isError: boolean;
  };

  const {
    data: clubData,
    isLoading: clubIsLoading,
    isError: clubIsError,
  } = useGetClubDetail(idData.clubId.toString()) as {
    data: ApiClb002ResponseOK;
    isLoading: boolean;
    isError: boolean;
  };

  const {
    data: memberData,
    isLoading: memberIsLoading,
    isError: memberIsError,
    refetch: memberRefetch,
  } = useGetMemberRegistration({ clubId: idData.clubId }) as {
    data: ApiReg008ResponseOk;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };

  const totalPage =
    memberData && Math.ceil(memberData.applies.length / pageSize);

  const paginatedMembers =
    memberData?.applies.slice((page - 1) * pageSize, page * pageSize) || [];

  return (
    <TableWithPagination>
      <AsyncBoundary
        isLoading={clubIsLoading || memberIsLoading || delegatesIsLoading}
        isError={clubIsError || memberIsError || delegatesIsError}
      >
        {memberData && (
          <MembersTable
            memberList={paginatedMembers}
            clubName={clubData.nameKr}
            clubId={idData.clubId}
            refetch={memberRefetch}
            delegates={delegatesNow.delegates}
          />
        )}
        {totalPage !== 1 && (
          <Pagination
            totalPage={totalPage}
            currentPage={page}
            limit={pageSize}
            setPage={setPage}
          />
        )}
      </AsyncBoundary>
    </TableWithPagination>
  );
};

export default RegisterMemberList;
