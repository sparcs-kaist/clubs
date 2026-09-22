"use client";

import type { NextPage } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import styled from "styled-components";

import notFoundImage from "@sparcs-clubs/web/assets/not-found.png";

const ImageWrapper = styled.div`
  display: flex;
  min-height: inherit;
  align-items: center;
  justify-content: center;
`;

const Illustration = styled(Image)`
  width: 100%;
  max-width: 800px;
  height: auto;
  mix-blend-mode: multiply;
`;

const NotFound: NextPage = () => {
  const t = useTranslations("common");

  return (
    <ImageWrapper>
      <Illustration
        src={notFoundImage}
        alt={t("notFound")}
        sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 960px) 560px, (max-width: 1200px) 640px, 800px"
        priority
      />
    </ImageWrapper>
  );
};

export default NotFound;
