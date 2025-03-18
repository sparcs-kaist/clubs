import isPropValid from "@emotion/is-prop-valid";
import React, { ReactNode, useMemo } from "react";
import styled from "styled-components";

import colors from "@sparcs-clubs/web/styles/themes/colors";

import Icon from "../Icon";

export type TableCellType =
  | "Default"
  | "None"
  | "Tag"
  | "Header"
  | "HeaderSort";

interface TableCellProps {
  type: TableCellType;
  children: ReactNode;
  width?: string | number;
  minWidth?: number;
  onClick?: (event: React.MouseEvent<HTMLTableCellElement>) => void;
}

const CommonCellHeaderWrapper = styled.th.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{
  isHeader: boolean;
  width: string | number;
  minWidth: number;
}>`
  width: ${({ width }) => (typeof width === "number" ? `${width}%` : width)};
  min-width: ${({ minWidth }) => `${minWidth}px`};
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
  padding: 12px 8px;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  background-color: ${({ theme, isHeader }) =>
    isHeader ? theme.colors.PRIMARY : "transparent"};
`;

const CommonCellBodyWrapper = styled.td.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{
  isHeader: boolean;
  width: string | number;
  minWidth: number;
}>`
  width: ${({ width }) => (typeof width === "number" ? `${width}%` : width)};
  min-width: ${({ minWidth }) => `${minWidth}px`};
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
  padding: 12px 8px;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  background-color: ${({ theme, isHeader }) =>
    isHeader ? theme.colors.PRIMARY : "transparent"};
`;

const CellText = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ isGray: boolean }>`
  font-size: 16px;
  line-height: 24px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ isGray, theme }) =>
    isGray ? theme.colors.GRAY[300] : theme.colors.BLACK};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderInner = styled.div`
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  color: ${({ theme }) => theme.colors.WHITE};
`;

const SortWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 0px;
  padding-left: 20px;
`;

const TableCell: React.FC<TableCellProps> = ({
  type,
  children,
  width = "150px",
  minWidth = 100,
  onClick = () => {},
}) => {
  const isHeader = type === "Header" || type === "HeaderSort";
  const CommonCellWrapper = useMemo(
    () => (isHeader ? CommonCellHeaderWrapper : CommonCellBodyWrapper),
    [isHeader],
  );

  let content;

  switch (type) {
    case "Default":
      content = <CellText isGray={false}>{children}</CellText>;
      break;
    case "None":
      content = <CellText isGray>{children}</CellText>;
      break;
    case "Tag":
      content = children;
      break;
    case "Header":
      content = <HeaderInner>{children}</HeaderInner>;
      break;
    case "HeaderSort":
      content = (
        <SortWrapper>
          <HeaderInner>{children}</HeaderInner>
          <Icon type="arrow_drop_down" size={24} color={colors.WHITE} />
        </SortWrapper>
      );
      break;
    default:
      throw new Error(`Unhandled cell type: ${type}`);
  }

  return (
    <CommonCellWrapper
      width={width}
      minWidth={minWidth}
      isHeader={isHeader}
      onClick={onClick}
    >
      {content}
    </CommonCellWrapper>
  );
};

export default TableCell;
