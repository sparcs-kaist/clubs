"use client";

import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import useQueryState from "@sparcs-clubs/web/common/hooks/useQueryState";

import ClubRegistrationTable from "../components/ClubRegistrationTable";
import { useGetRegisterClub } from "../services/useGetRegisterClub";

const TableWithPaginationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  align-self: stretch;
`;

export const RegistrationClubFrame = () => {
  const [currentPage, setCurrentPage] = useQueryState<number>("page", 1);
  const limit = 10;

  const { data, isLoading, isError } = useGetRegisterClub({
    pageOffset: currentPage,
    itemCount: limit,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!data) {
    return null;
  }

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <TableWithPaginationWrapper>
        <ClubRegistrationTable {...data} />
        <FlexWrapper direction="row" gap={16} justify="center">
          <Pagination
            totalPage={Math.ceil(data.total / limit)}
            currentPage={currentPage}
            limit={limit}
            setPage={handlePageChange}
          />
        </FlexWrapper>
      </TableWithPaginationWrapper>
    </AsyncBoundary>
  );
};
