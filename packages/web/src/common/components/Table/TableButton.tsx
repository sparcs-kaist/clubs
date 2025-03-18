import isPropValid from "@emotion/is-prop-valid";
import React from "react";
import styled from "styled-components";

import TextButton from "../Buttons/TextButton";
import FlexWrapper from "../FlexWrapper";

interface TableButtonProps {
  text: string[];
  onClick: (() => void)[];
  clickable: boolean[];
}

const CellText = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ isGray: boolean }>`
  font-size: 16px;
  line-height: 24px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ isGray, theme }) =>
    isGray ? theme.colors.GRAY[300] : theme.colors.BLACK};
`;

const TableButton: React.FC<TableButtonProps> = ({
  text,
  onClick,
  clickable,
}) => (
  <FlexWrapper direction="row" gap={12}>
    {text.map((item, index) => (
      <React.Fragment key={item}>
        <TextButton
          text={item}
          onClick={onClick[index]}
          disabled={!clickable[index]}
        />
        {index < text.length - 1 && <CellText isGray>/</CellText>}
      </React.Fragment>
    ))}
  </FlexWrapper>
);

export default TableButton;
