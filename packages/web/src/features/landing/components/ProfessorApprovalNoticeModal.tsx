import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";

import type { ProfessorPendingApproval } from "../utils/getProfessorPendingApprovals";

const Dialog = styled.dialog`
  width: min(600px, calc(100% - 32px));
  max-height: 80vh;
  max-height: 80dvh;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.round.md};
  box-shadow: ${({ theme }) => theme.shadow.md};
  overflow: hidden;
  &::backdrop {
    background: rgba(85, 85, 85, 0.25);
  }
  &[open] {
    display: flex;
    flex-direction: column;
  }
  a:focus-visible,
  button:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.PRIMARY};
    outline-offset: 2px;
  }
`;

const Title = styled.h2`
  flex-shrink: 0;
  margin: 0;
  padding: 24px 24px 16px;
  font-size: 20px;
  line-height: 30px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.SEMIBOLD};
`;

const ClubList = styled.ul`
  padding: 0 24px;
  overflow-y: auto;
  min-height: 0;
  list-style: none;
`;

const ClubRow = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: ${({ theme }) => theme.fonts.WEIGHT.SEMIBOLD};
    overflow-wrap: anywhere;
  }
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
`;

const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  max-width: 100%;
  a {
    padding: 8px;
    border-radius: 4px;
    color: ${({ theme }) => theme.colors.MINT[800]};
    background: ${({ theme }) => theme.colors.MINT[100]};
    font-size: 14px;
    line-height: 20px;
    text-decoration: underline;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
`;

const ProfessorApprovalNoticeModal = ({
  clubs,
  onClose,
  onHideToday,
}: {
  clubs: ProfessorPendingApproval[];
  onClose: () => void;
  onHideToday: () => void;
}) => {
  const t = useTranslations("main.professor_approval_notice");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    titleRef.current?.focus();
    return () => dialog?.close();
  }, []);

  return (
    <Dialog
      ref={dialogRef}
      aria-labelledby="professor-approval-notice-title"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <Title id="professor-approval-notice-title" ref={titleRef} tabIndex={-1}>
        {t("title")}
      </Title>
      <ClubList>
        {clubs.map(club => (
          <ClubRow key={club.clubId}>
            <h3>{club.clubName}</h3>
            <Links>
              {club.activityCount > 0 && (
                <Link
                  href={`/manage-club?clubId=${club.clubId}`}
                  onClick={onClose}
                  aria-label={t("view_activities_label", {
                    clubName: club.clubName,
                    count: club.activityCount,
                  })}
                >
                  {t("view_activities", { count: club.activityCount })}
                </Link>
              )}
              {club.registrationIds.map((id, index) => (
                <Link
                  key={id}
                  href={`/my/register-club/${id}`}
                  onClick={onClose}
                  aria-label={t("view_registration_label", {
                    clubName: club.clubName,
                    index: index + 1,
                  })}
                >
                  {t(
                    club.registrationIds.length > 1
                      ? "view_numbered_registration"
                      : "view_registration",
                    { index: index + 1 },
                  )}
                </Link>
              ))}
            </Links>
          </ClubRow>
        ))}
      </ClubList>
      <Footer>
        <Button type="outlined" onClick={onHideToday}>
          {t("hide_today")}
        </Button>
        <Button onClick={onClose}>{t("close")}</Button>
      </Footer>
    </Dialog>
  );
};

export default ProfessorApprovalNoticeModal;
