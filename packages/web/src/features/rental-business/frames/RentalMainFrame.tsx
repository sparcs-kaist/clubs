import PageTitle from "@sparcs-clubs/web/common/components/PageTitle";
import React from "react";
import styled from "styled-components";
import RentalNoticeFrame from "./RentalNoticeFrame";
import type { RentalInterface } from "../types/rental";
import RentalInfoFrame from "./RentalInfoFrame";

const RentalMainFrameInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 60px;
`;

const RentalMainFrame: React.FC = () => {
  const [rental, setRental] = React.useState<RentalInterface>({
    agreement: false,
  });
  const props = { rental, setRental };
  return (
    <RentalMainFrameInner>
      <PageTitle>대여 사업</PageTitle>
      {rental.agreement ? (
        <RentalInfoFrame {...props} />
      ) : (
        <RentalNoticeFrame {...props} />
      )}
    </RentalMainFrameInner>
  );
};

export default RentalMainFrame;
