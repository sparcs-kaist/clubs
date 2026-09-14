import { useOverlayData } from "overlay-kit";
import React, { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

import useProfessorPendingApprovals from "../services/useProfessorPendingApprovals";
import {
  hideProfessorApprovalNoticeToday,
  isProfessorApprovalNoticeHidden,
} from "../utils/professorApprovalNoticeStorage";
import ProfessorApprovalNoticeModal from "./ProfessorApprovalNoticeModal";

const PendingApprovals = ({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) => {
  const query = useProfessorPendingApprovals(userId);
  const overlays = useOverlayData();
  if (Object.values(overlays).some(item => item.isOpen)) return null;
  if (!query.isFetchedAfterMount || query.isError) return null;
  if (!query.data?.length) return null;

  return (
    <ProfessorApprovalNoticeModal
      clubs={query.data}
      onClose={onClose}
      onHideToday={() => {
        hideProfessorApprovalNoticeToday(userId);
        onClose();
      }}
    />
  );
};

const ProfessorNotice = ({ userId }: { userId: number }) => {
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const checkHidden = () =>
      setHidden(isProfessorApprovalNoticeHidden(userId));
    checkHidden();
    window.addEventListener("storage", checkHidden);
    return () => window.removeEventListener("storage", checkHidden);
  }, [userId]);

  if (hidden !== false || dismissed) return null;
  return (
    <PendingApprovals userId={userId} onClose={() => setDismissed(true)} />
  );
};

const ProfessorApprovalNotice = () => {
  const { profile, isLoginNoticeComplete } = useAuth();
  if (!isLoginNoticeComplete || profile?.type !== UserTypeEnum.Professor) {
    return null;
  }
  return <ProfessorNotice key={profile.id} userId={profile.id} />;
};

export default ProfessorApprovalNotice;
