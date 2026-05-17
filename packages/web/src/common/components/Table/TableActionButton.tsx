import React from "react";
import styled from "styled-components";

import Icon from "../Icon";

export type TableActionButtonVariant = "edit" | "delete";

interface TableActionButtonProps {
  variant: TableActionButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const actionMeta = {
  edit: {
    icon: "edit",
    label: "수정",
  },
  delete: {
    icon: "delete_outline",
    label: "삭제",
  },
};

const TableActionButtonInner = styled.button<{
  $variant: TableActionButtonVariant;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
  min-width: 64px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid
    ${({ $variant, theme }) =>
      $variant === "edit" ? theme.colors.MINT[300] : theme.colors.RED[600]};
  background: ${({ $variant, theme }) =>
    $variant === "edit" ? theme.colors.MINT[100] : theme.colors.RED[100]};
  color: ${({ $variant, theme }) =>
    $variant === "edit" ? theme.colors.PRIMARY : theme.colors.RED[600]};
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 14px;
  line-height: 18px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ $variant, theme }) =>
      $variant === "edit" ? theme.colors.PRIMARY : theme.colors.RED[600]};
    background: ${({ theme }) => theme.colors.WHITE};
  }

  &:focus-visible {
    outline: 2px solid
      ${({ $variant, theme }) =>
        $variant === "edit" ? theme.colors.MINT[300] : theme.colors.RED[600]};
    outline-offset: 2px;
  }

  &:disabled {
    border-color: ${({ theme }) => theme.colors.GRAY[300]};
    background: ${({ theme }) => theme.colors.GRAY[100]};
    color: ${({ theme }) => theme.colors.GRAY[300]};
    cursor: not-allowed;
  }
`;

export const TableActionButtonGroup = styled.div`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: max-content;
`;

const TableActionButton = ({
  variant,
  disabled = false,
  onClick = () => {},
  children = undefined,
}: TableActionButtonProps) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      onClick();
    }
  };
  const { icon, label } = actionMeta[variant];

  return (
    <TableActionButtonInner
      type="button"
      $variant={variant}
      disabled={disabled}
      aria-label={label}
      onClick={handleClick}
    >
      <Icon type={icon} size={16} color="inherit" />
      {children ?? label}
    </TableActionButtonInner>
  );
};

export default TableActionButton;
