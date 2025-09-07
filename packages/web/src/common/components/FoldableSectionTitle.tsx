"use client";

import isPropValid from "@emotion/is-prop-valid";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";

const FoldableSectionOuter = styled.div`
  width: 100%;
  max-width: calc(100vw + (100% - 100vw));
`;

const FoldableSectionTitleInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
`;

const ChildrenOuter = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ margin?: string }>`
  margin-top: ${({ margin }) => margin};
  margin-left: 24px;
`;

const FoldableSectionTitle: React.FC<{
  title: string;
  toggle?: boolean;
  toggleHandler?: () => void;
  children?: React.ReactNode;
  childrenMargin?: string;
}> = ({
  title,
  toggle = null,
  toggleHandler = null,
  children = null,
  childrenMargin = "40px",
}) => {
  const [open, setOpen] = React.useState<boolean>(true);
  const openHandler = () => setOpen(!open);
  const t = useTranslations("common");

  return (
    <FoldableSectionOuter>
      <FoldableSectionTitleInner>
        <SectionTitle size="lg">{title}</SectionTitle>
        <TextButton
          fs={14}
          fw="REGULAR"
          color="BLACK"
          text={(toggle ?? open) ? t("접기") : t("펼치기")}
          onClick={toggleHandler ?? openHandler}
        />
      </FoldableSectionTitleInner>
      {(toggle ?? open) && children && (
        <ChildrenOuter margin={childrenMargin}>{children}</ChildrenOuter>
      )}
    </FoldableSectionOuter>
  );
};

export default FoldableSectionTitle;
