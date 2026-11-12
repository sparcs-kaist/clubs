import Link from "next/link";
import type { PropsWithChildren } from "react";
import styled, { css } from "styled-components";

import {
  studentUserTypes,
  UserTypeEnum,
} from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import { getRentalErrorMessage } from "../services/rentalApi";

const control = css`
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.WHITE};
  color: inherit;
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.PRIMARY};
    outline-offset: 1px;
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.GRAY[100]};
  }
`;

export const RentalInput = styled.input`
  ${control}
`;
export const RentalSelect = styled.select`
  ${control}
`;
export const RentalTextarea = styled.textarea`
  ${control}
  min-height: 76px;
  resize: vertical;
`;

export const RentalField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
`;

export const RentalFieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 16px;
`;

export const RentalActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
`;

export const RentalLink = styled(Link)`
  color: ${({ theme }) => theme.colors.MINT[800]};
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.MEDIUM};
  text-decoration: underline;
  text-underline-offset: 3px;
`;

export const RentalError = ({
  error,
  fallback,
  retry,
}: {
  error: unknown;
  fallback: string;
  retry?: () => void;
}) => (
  <FlexWrapper direction="column" gap={8}>
    <p role="alert">{getRentalErrorMessage(error, fallback)}</p>
    {retry && (
      <RentalActions>
        <Button type="outlined" onClick={retry}>
          다시 불러오기
        </Button>
      </RentalActions>
    )}
  </FlexWrapper>
);

export const RentalAuth = ({
  children,
  executive = false,
}: PropsWithChildren<{ executive?: boolean }>) => {
  const { isLoggedIn, login, profile } = useAuth();
  if (!isLoggedIn) return <LoginRequired login={login} />;
  if (!profile) return <AsyncBoundary isLoading isError={false} />;
  const authorized = executive
    ? profile.type === UserTypeEnum.Executive
    : studentUserTypes.includes(profile.type);
  if (!authorized) return <p>이 화면을 이용할 권한이 없습니다.</p>;
  return <>{children}</>;
};
