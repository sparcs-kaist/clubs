"use client";

import React, { useState } from "react";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import TableCell from "@sparcs-clubs/web/common/components/Table/TableCell";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useQueryState from "@sparcs-clubs/web/common/hooks/useQueryState";

import {
  activityCertificateColumnSort,
  commonSpaceColumnSort,
  printingBusinessColumnSort,
  rentalBusinessColumnSort,
} from "../services/columnSort";
import {
  ManageClubActivityCertificateStatus,
  ManageClubCommonSpaceStatus,
  ManageClubPrintingBusinessStatus,
  ManageClubRentalBusinessStatus,
  ManageClubTagColorsInterface,
  ServiceType,
} from "../types/ManageClubTable";
import {
  formattedString,
  ManageClubTagColors,
} from "../types/ManageClubTableConst";
import {
  activityCertificateHeaders,
  commonSpaceHeaders,
  printingBusinessHeaders,
  rentalBusinessHeaders,
} from "../types/ManageClubTableHeader";
import {
  activityCertificateMockData,
  commonSpaceMockData,
  printingBusinessMockData,
  rentalBusinessMockData,
} from "../types/mock";

interface ManageClubTableMainFrameProps {
  pageType: ServiceType;
}

const ManageClubTablePageMainFrameInner = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  align-items: center;
`;

const TableFrameInner = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px #dddddd solid;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  display: inline-flex;
  margin-bottom: 20px;
`;

const TableRowFrameInner = styled.div`
  width: 100%;
  align-items: flex-start;
  display: grid;
`;

const TableCellInner = styled.div`
  width: 100%;
  height: 100%;
`;

const mockData = (type: ServiceType, sortColumnName: string) => {
  switch (type) {
    case "rental-business":
      return rentalBusinessMockData.sort(
        rentalBusinessColumnSort(sortColumnName),
      );
    case "printing-business":
      return printingBusinessMockData.sort(
        printingBusinessColumnSort(sortColumnName),
      );
    case "activity-certificate":
      return activityCertificateMockData.sort(
        activityCertificateColumnSort(sortColumnName),
      );
    default: // "common-space"
      return commonSpaceMockData.sort(commonSpaceColumnSort(sortColumnName));
  }
};

const headerTypes = (type: ServiceType) => {
  switch (type) {
    case "rental-business":
      return rentalBusinessHeaders;
    case "printing-business":
      return printingBusinessHeaders;
    case "activity-certificate":
      return activityCertificateHeaders;
    default: // "common-space"
      return commonSpaceHeaders;
  }
};

const statusTypes = (type: ServiceType) => {
  switch (type) {
    case "rental-business":
      return ManageClubRentalBusinessStatus;
    case "printing-business":
      return ManageClubPrintingBusinessStatus;
    case "activity-certificate":
      return ManageClubActivityCertificateStatus;
    default: // "common-space"
      return ManageClubCommonSpaceStatus;
  }
};

const ManageClubTableMainFrame: React.FC<ManageClubTableMainFrameProps> = ({
  pageType,
}) => {
  // TODO - 실제 API 연결 시 올바른 형식으로 실제 데이터 값 넣어주기

  const [page, setPage] = useQueryState<number>("page", 1);
  const [sortColumnName, setSortColumnName] = useState<string>("신청 일시");

  const unslicedData = mockData(pageType, sortColumnName);
  const data = mockData(pageType, sortColumnName).slice(
    (page - 1) * 10,
    page * 10,
  );

  const headers = headerTypes(pageType);

  const titles = {
    "rental-business": "대여 사업 신청",
    "printing-business": "홍보물 인쇄",
    "activity-certificate": "활동확인서 발급",
    "common-space": "공용공간 비정기사용",
  };
  const title = titles[pageType];

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          {
            name: `${title} 내역`,
            path: `/manage-club/${pageType}`,
          },
        ]}
        title={`${title} 내역`}
      />
      <ManageClubTablePageMainFrameInner>
        <Typography
          color="GRAY.600"
          style={{
            width: "100%",
            marginBottom: "8px",
            textAlign: "right",
          }}
        >
          {`총 ${unslicedData.length}개`}
        </Typography>
        <TableFrameInner>
          <TableRowFrameInner
            style={{
              gridTemplateColumns: headers
                .map(headerInfo => headerInfo.headerWidth)
                .join(" "),
            }}
          >
            {headers.map((headerInfo, index) => (
              <TableCellInner
                style={
                  headerInfo.headerType === "HeaderSort"
                    ? {
                        gridColumn: `${index + 1} / ${index + 2}`,
                        cursor: "pointer",
                      }
                    : { gridColumn: `${index + 1} / ${index + 2}` }
                }
                key={headerInfo.headerName}
                onClick={
                  headerInfo.headerType === "HeaderSort"
                    ? () => setSortColumnName(headerInfo.headerName)
                    : () => {}
                }
              >
                <TableCell type={headerInfo.headerType} width="100%">
                  {headerInfo.headerName}
                </TableCell>
              </TableCellInner>
            ))}
          </TableRowFrameInner>

          {data.map((rowInfo, rowIndex) => (
            <TableRowFrameInner
              style={{
                gridTemplateColumns: headers
                  .map(headerInfo => headerInfo.headerWidth)
                  .join(" "),
                borderBottom: "1px #EEEEEE solid",
              }}
              key={`row${rowIndex.toString()}`}
            >
              {Object.entries(rowInfo).map(([key, value], index) => (
                <TableCellInner
                  style={{
                    gridColumn: `${index + 1} / ${index + 2}`,
                  }}
                  key={key}
                >
                  <TableCell type="Default" width="100%">
                    {key === "status" ? (
                      <Tag
                        color={
                          ManageClubTagColors[
                            Object.keys(statusTypes(pageType))[
                              Object.values(statusTypes(pageType)).indexOf(
                                value,
                              )
                            ] as keyof ManageClubTagColorsInterface
                          ]
                        }
                      >
                        {value}
                      </Tag>
                    ) : (
                      formattedString(key, value)
                    )}
                  </TableCell>
                </TableCellInner>
              ))}
            </TableRowFrameInner>
          ))}
        </TableFrameInner>
        {unslicedData.length > 1 && (
          <Pagination
            totalPage={Math.ceil(unslicedData.length / 10)}
            currentPage={page}
            limit={10}
            setPage={setPage}
          />
        )}
      </ManageClubTablePageMainFrameInner>
    </FlexWrapper>
  );
};

export default ManageClubTableMainFrame;
