import { toZonedTime } from "date-fns-tz";
import React from "react";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { patchNote } from "@sparcs-clubs/web/constants/patchNote";

export interface AgreementModalProps {
  isOpen: boolean;
  latestPatchNote: patchNote;
  onConfirm: () => void;
}

const StyledModalContainer = styled.div`
  width: 536px;
  display: flex;
  flex-direction: column;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    width: 216px;
  }
  gap: 16px;
`;

const StyledVersionDateContainer = styled.div`
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    display: grid;
    gap: 5px;
  }
  display: inline-flex;
  gap: 40px;
`;

const StyledTextContainer = styled.div`
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
  display: flex;
`;

const PatchNoteModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onConfirm,
  latestPatchNote,
}) =>
  latestPatchNote && (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <StyledModalContainer>
        <Typography fs={20} lh={24} fw="SEMIBOLD">
          🛠️ 패치노트
        </Typography>
        <StyledVersionDateContainer>
          <StyledTextContainer>
            <Typography fs={16} lh={24} fw="BOLD">
              버전
            </Typography>
            <Typography fs={16} lh={24} fw="MEDIUM">
              {latestPatchNote.version}
            </Typography>
          </StyledTextContainer>
          <StyledTextContainer>
            <Typography fs={16} lh={24} fw="BOLD">
              날짜
            </Typography>
            <Typography fs={16} lh={24} fw="MEDIUM">
              {(() => {
                const d = toZonedTime(latestPatchNote.date, "Asia/Seoul");
                return `${String(d.getFullYear())}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
              })()}
            </Typography>
          </StyledTextContainer>
        </StyledVersionDateContainer>
        <Card gap={16} padding="16px" outline>
          <Typography
            fs={16}
            lh={24}
            fw="MEDIUM"
            style={{ whiteSpace: "pre-wrap", minHeight: "100px" }}
          >
            {latestPatchNote.patchNoteContent}
          </Typography>
        </Card>

        <Button onClick={onConfirm}>확인</Button>
      </StyledModalContainer>
    </Modal>
  );

export default PatchNoteModal;
