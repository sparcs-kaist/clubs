"use client";

import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkIcon from "@mui/icons-material/Link";
import YouTubeIcon from "@mui/icons-material/YouTube";
import React from "react";
import styled from "styled-components";

import ClubLinkButton from "@sparcs-clubs/web/features/clubs/components/ClubLinkButton";

const EmptyLinkText = styled.div`
  width: 100%;
  font-size: 16px;
  line-height: 28px;
  font-weight: 400;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.colors.GRAY[300]};
`;

const ClubLinks = [
  {
    title: "Instagram",
    link: "https://instagram.com/the_ult_taste",
    icon: InstagramIcon,
  },
  {
    title: "YouTube",
    link: "https://youtube.com/the_ult_taste",
    icon: YouTubeIcon,
  },
  {
    title:
      "Facebook 반응형 테스트 반응형 테스트 반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트",
    link: "https://facebook.com/the_ult_taste",
    icon: FacebookOutlinedIcon,
  },
  {
    title: "Link",
    link: "https://the_ult_taste.co.kr",
    icon: LinkIcon,
  },
];

const ClubLinksList: React.FC = () => (
  <>
    {ClubLinks.length > 0 ? (
      ClubLinks.map(item => (
        <ClubLinkButton
          key={item.title}
          title={item.title}
          link={item.link}
          icon={item.icon}
        />
      ))
    ) : (
      <EmptyLinkText>등록된 링크가 없습니다.</EmptyLinkText>
    )}
  </>
);

export default ClubLinksList;
