"use client";

import { useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import { useEffect, useRef } from "react";

import type { ApiClb013ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb013";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import Modal from "@sparcs-clubs/web/common/components/Modal";
import type { Profile } from "@sparcs-clubs/web/common/providers/AuthContext";

import ChangeRepresentativeModalContent from "../components/ChangeRepresentativeModalContent";

export const delegateRoleLabelKeys = {
  [ClubDelegateEnum.Representative]: "roles.representative",
  [ClubDelegateEnum.Delegate1]: "roles.delegate1",
  [ClubDelegateEnum.Delegate2]: "roles.delegate2",
} as const;

const useDelegateChangeRequestModal = (profile: Profile) => {
  const t = useTranslations("my.representative");
  const openedOverlay = useRef<string | undefined>(undefined);
  const { id, type, studentId } = profile;

  useEffect(
    () => () => {
      if (openedOverlay.current !== undefined) {
        overlay.unmount(openedOverlay.current);
        openedOverlay.current = undefined;
      }
    },
    [id, type, studentId],
  );

  return (request: ApiClb013ResponseOk["requests"][number]) => {
    if (openedOverlay.current !== undefined) return;

    openedOverlay.current = overlay.open(({ isOpen, unmount }) => (
      <Modal isOpen={isOpen}>
        <ChangeRepresentativeModalContent
          clubName={request.clubName}
          role={t(delegateRoleLabelKeys[request.delegateEnumId])}
          requester={`${request.prevStudentNumber} ${request.prevStudentName}`}
          onClose={() => {
            openedOverlay.current = undefined;
            unmount();
          }}
          profile={profile}
          requestId={request.id}
        />
      </Modal>
    ));
  };
};

export default useDelegateChangeRequestModal;
