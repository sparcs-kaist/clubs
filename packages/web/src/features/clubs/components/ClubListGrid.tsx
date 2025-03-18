"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";

import paths from "@sparcs-clubs/web/constants/paths";
import ClubCard from "@sparcs-clubs/web/features/clubs/components/ClubCard";

import { ClubDetail } from "../types";

interface ClubListGridItemProps {
  clubList: Array<ClubDetail>;
  isRegistrationPeriod?: boolean;
}

const ClubListGridInner = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.xl}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.lg}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
`;

const ClubListGrid: React.FC<ClubListGridItemProps> = ({
  clubList,
  isRegistrationPeriod = false,
}) => {
  const theme = useTheme();
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(
        window.innerWidth <= parseInt(theme.responsive.BREAKPOINT.sm),
      );
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <ClubListGridInner>
      {clubList.map((club: ClubDetail) => (
        <Link
          key={club.id}
          href={`${paths.CLUBS.sub[0].path}/${club.id.toString()}`}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <ClubCard
            key={club.nameKr}
            club={club}
            isRegistrationPeriod={isRegistrationPeriod}
            isMobile={isMobileView}
          />
        </Link>
      ))}
    </ClubListGridInner>
  );
};

export default ClubListGrid;
