"use client";

import { useTranslations } from "next-intl";
import { useOverlayData } from "overlay-kit";
import { useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";

import type { ApiClb013ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb013";
import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import {
  type Profile,
  useAuth,
} from "@sparcs-clubs/web/common/providers/AuthContext";
import useDelegateChangeRequestModal, {
  delegateRoleLabelKeys,
} from "@sparcs-clubs/web/features/my/hooks/useDelegateChangeRequestModal";
import { useGetMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/getMyDelegateRequest";
import isStudent from "@sparcs-clubs/web/utils/isStudent";

type DelegateRequest = ApiClb013ResponseOk["requests"][number];

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

  h2 {
    margin: 0;
    padding: 24px 24px 16px;
    font-size: 20px;
    line-height: 30px;
    font-weight: ${({ theme }) => theme.fonts.WEIGHT.SEMIBOLD};
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: ${({ theme }) => theme.fonts.WEIGHT.SEMIBOLD};
    overflow-wrap: anywhere;
  }

  button:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.PRIMARY};
    outline-offset: 2px;
  }
`;

const RequestList = styled.ul`
  padding: 0 24px;
  margin: 0;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
`;

const RequestRow = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 16px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
`;

const DelegateChangeRequestDialog = ({
  requests,
  onDismiss,
  onReview,
}: {
  requests: DelegateRequest[];
  onDismiss: () => void;
  onReview: (request: DelegateRequest) => void;
}) => {
  const t = useTranslations("main.delegate_change_notice");
  const roleT = useTranslations("my.representative");
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    titleRef.current?.focus();
    return () => dialog?.close();
  }, []);

  const dismiss = () => {
    dialogRef.current?.close();
    onDismiss();
  };

  return (
    <Dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault();
        dismiss();
      }}
    >
      <h2 id={titleId} ref={titleRef} tabIndex={-1}>
        {t("title")}
      </h2>
      <RequestList>
        {requests.map(request => {
          const { id, clubName, delegateEnumId } = request;
          const role = roleT(delegateRoleLabelKeys[delegateEnumId]);
          return (
            <RequestRow key={id}>
              <div>
                <h3>{clubName}</h3>
                <span>{role}</span>
              </div>
              <Button
                type="outlined"
                aria-label={t("review_label", { clubName, role })}
                onClick={() => {
                  dismiss();
                  onReview(request);
                }}
              >
                {t("review")}
              </Button>
            </RequestRow>
          );
        })}
      </RequestList>
      <Footer>
        <Button onClick={dismiss}>{t("close")}</Button>
      </Footer>
    </Dialog>
  );
};

const PendingDelegateChangeRequestNotice = ({
  profile,
}: {
  profile: Profile;
}) => {
  const [dismissed, setDismissed] = useState(false);
  const query = useGetMyDelegateRequest(profile);
  const openRequest = useDelegateChangeRequestModal(profile);
  const overlays = useOverlayData();

  if (dismissed || !query.isFetchedAfterMount || query.isError) return null;
  if (Object.values(overlays).some(item => item.isOpen)) return null;

  const requests = query.data?.requests.filter(
    request =>
      request.clubDelegateChangeRequestStatusEnumId ===
      ClubDelegateChangeRequestStatusEnum.Applied,
  );
  if (!requests?.length) return null;

  return (
    <DelegateChangeRequestDialog
      requests={requests}
      onDismiss={() => setDismissed(true)}
      onReview={openRequest}
    />
  );
};

const DelegateChangeRequestNotice = () => {
  const { isLoginNoticeComplete, profile } = useAuth();
  if (!isLoginNoticeComplete || !profile || !isStudent(profile)) return null;

  return (
    <PendingDelegateChangeRequestNotice
      key={`${profile.id}:${profile.type}:${profile.studentId ?? ""}`}
      profile={profile}
    />
  );
};

export default DelegateChangeRequestNotice;
