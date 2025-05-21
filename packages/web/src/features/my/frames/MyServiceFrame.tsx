"use client";

import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import MyActivityCertificateTable from "@sparcs-clubs/web/features/activity-certificate/components/MyActivityCertificateTable";
import MyCommonSpaceTable from "@sparcs-clubs/web/features/common-space/components/MyCommonSpaceTable";
import MyPrintingTable from "@sparcs-clubs/web/features/printing-business/components/MyPrintingTable";
import MyRentalTable from "@sparcs-clubs/web/features/rental-business/components/MyRentalTable";
import { useGetMyRentals } from "@sparcs-clubs/web/features/rental-business/services/useGetMyRentals";

import { useGetMyActivityCertificate } from "../services/getMyActivityCertificate";
import { useGetMyCommonSpace } from "../services/getMyCommonSpace";
import { useGetMyPrinting } from "../services/getMyPrinting";

const MyServiceFrame: React.FC = () => {
  // TODO: 실제 필요한 값으로 바꾸기
  const startDate = new Date("2024-01-01");
  const endTerm = new Date("2024-12-31");
  const pageOffset = 1;
  const itemCount = 10;

  const {
    data: myRental,
    isLoading: rentalLoading,
    isError: rentalError,
  } = useGetMyRentals(startDate, endTerm, pageOffset, itemCount);

  const {
    data: myPrinting,
    isLoading: printingLoading,
    isError: printingError,
  } = useGetMyPrinting(startDate, endTerm, pageOffset, itemCount);

  const {
    data: myActivityCertificate,
    isLoading: acfLoading,
    isError: acfError,
  } = useGetMyActivityCertificate(startDate, endTerm, pageOffset, itemCount);

  const {
    data: myCommonSpace,
    isLoading: cmsLoading,
    isError: cmsError,
  } = useGetMyCommonSpace(startDate, endTerm, pageOffset, itemCount);

  return (
    <FoldableSectionTitle title="서비스 신청 내역">
      <FlexWrapper direction="column" gap={40}>
        <FlexWrapper direction="column" gap={20}>
          <MoreDetailTitle
            title="대여 사업"
            moreDetail="내역 더보기"
            moreDetailPath="/my/rental-business"
          />
          <AsyncBoundary isLoading={rentalLoading} isError={rentalError}>
            <MyRentalTable
              rentalList={myRental ?? { total: 0, items: [], offset: 0 }}
            />
          </AsyncBoundary>
        </FlexWrapper>
        <FlexWrapper direction="column" gap={20}>
          <MoreDetailTitle
            title="홍보물 인쇄"
            moreDetail="내역 더보기"
            moreDetailPath="/my/printing-business"
          />
          <AsyncBoundary isLoading={printingLoading} isError={printingError}>
            <MyPrintingTable
              printingList={myPrinting ?? { total: 0, items: [], offset: 0 }}
            />
          </AsyncBoundary>
        </FlexWrapper>
        <FlexWrapper direction="column" gap={20}>
          <MoreDetailTitle
            title="활동확인서 발급"
            moreDetail="내역 더보기"
            moreDetailPath="/my/activity-certificate"
          />
          <AsyncBoundary isLoading={acfLoading} isError={acfError}>
            <MyActivityCertificateTable
              certificateList={
                myActivityCertificate ?? { total: 0, items: [], offset: 0 }
              }
            />
          </AsyncBoundary>
        </FlexWrapper>
        <FlexWrapper direction="column" gap={20}>
          <MoreDetailTitle
            title="공용공간 비정기사용"
            moreDetail="내역 더보기"
            moreDetailPath="/my/common-space"
          />
          <AsyncBoundary isLoading={cmsLoading} isError={cmsError}>
            <MyCommonSpaceTable
              spaceList={myCommonSpace ?? { total: 0, items: [], offset: 0 }}
            />
          </AsyncBoundary>
        </FlexWrapper>
      </FlexWrapper>
    </FoldableSectionTitle>
  );
};

export default MyServiceFrame;
