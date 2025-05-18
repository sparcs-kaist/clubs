import React, { useEffect, useState } from "react";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import patchNoteList, {
  patchNote,
} from "@sparcs-clubs/web/constants/patchNote";

export interface AgreementModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const StyledModalContainer = styled.div`
  width: 600px;
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

const ResponsiveTypographyTitle = styled(Typography)`
  font-size: 20px;
  line-height: 24px;
  font-weight: 600;
`;

const ResponsiveTypographyContentBold = styled(Typography)`
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
`;

const ResponsiveTypographyContent = styled(Typography)`
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
`;

const ResponsiveTypographyPatchNoteContent = styled(Typography)`
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  white-space: pre-wrap;
  min-height: 100px;
`;

const PatchNoteModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  const [latestPatchNote, setLatestPatchNote] = useState<patchNote>();

  useEffect(() => {
    setLatestPatchNote(
      patchNoteList.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0],
    );
  }, [patchNoteList]);

  return (
    latestPatchNote && (
      <Modal isOpen={isOpen} onClose={() => {}}>
        <StyledModalContainer>
          <ResponsiveTypographyTitle>🛠️ 패치노트</ResponsiveTypographyTitle>
          <StyledVersionDateContainer>
            <StyledTextContainer>
              <ResponsiveTypographyContentBold>
                버전
              </ResponsiveTypographyContentBold>
              <ResponsiveTypographyContent>
                {latestPatchNote.version}
              </ResponsiveTypographyContent>
            </StyledTextContainer>
            <StyledTextContainer>
              <ResponsiveTypographyContentBold>
                날짜
              </ResponsiveTypographyContentBold>
              <ResponsiveTypographyContent>
                {`${String(latestPatchNote.date.getFullYear())}.${String(latestPatchNote.date.getMonth() + 1).padStart(2, "0")}.${String(latestPatchNote.date.getDate()).padStart(2, "0")}`}
              </ResponsiveTypographyContent>
            </StyledTextContainer>
          </StyledVersionDateContainer>
          <Card gap={16} padding="16px" outline>
            <ResponsiveTypographyPatchNoteContent>
              {latestPatchNote.patchNoteContent}
            </ResponsiveTypographyPatchNoteContent>
          </Card>

          <Button onClick={onConfirm}>확인</Button>
        </StyledModalContainer>
      </Modal>
    )
  );
};

export default PatchNoteModal;
