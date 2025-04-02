"use client";

import React from "react";
import styled from "styled-components";

import FacebookIconImg from "@sparcs-clubs/web/assets/icon-facebook.svg";
import InstagramIconImg from "@sparcs-clubs/web/assets/icon-instagram.svg";
import LinkIconImg from "@sparcs-clubs/web/assets/icon-link.svg";
import YoutubeIconImg from "@sparcs-clubs/web/assets/icon-youtube.svg";
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
    icon: InstagramIconImg,
  },
  {
    title: "YouTube",
    link: "https://youtube.com/the_ult_taste",
    icon: YoutubeIconImg,
  },
  {
    title:
      "Facebook 반응형 테스트 반응형 테스트 반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트반응형 테스트 반응형 테스트",
    link: "https://facebook.com/the_ult_taste",
    icon: FacebookIconImg,
  },
  {
    title: "Link",
    link: "https://the_ult_taste.co.kr",
    icon: LinkIconImg,
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
