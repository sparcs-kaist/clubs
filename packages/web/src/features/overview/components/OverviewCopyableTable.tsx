import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import Table, {
  type TableProps,
} from "@sparcs-clubs/web/common/components/Table";

const COPY_TOAST_DURATION_MS = 1600;

const CopyToast = styled.div`
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  z-index: ${({ theme }) => theme.zIndices.toast};
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.MINT[300]};
  background-color: ${({ theme }) => theme.colors.WHITE};
  box-shadow: ${({ theme }) => theme.shadow.md};
  color: ${({ theme }) => theme.colors.BLACK};
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 14px;
  line-height: 20px;
`;

type OverviewCopyableTableProps<T> = Omit<
  TableProps<T>,
  "contentWrap" | "onCellClick" | "useColumnSizeAsMinWidth" | "widthMode"
>;

const OverviewCopyableTable = <T,>(props: OverviewCopyableTableProps<T>) => {
  const [toastMessage, setToastMessage] = useState<string | undefined>();
  const timeoutRef = useRef<number | undefined>();

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setToastMessage(undefined);
    }, COPY_TOAST_DURATION_MS);
  }, []);

  const copyCellText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("클립보드에 복사되었습니다.");
      } catch {
        showToast("클립보드 복사에 실패했습니다.");
      }
    },
    [showToast],
  );

  return (
    <>
      <Table
        {...props}
        contentWrap
        initialHorizontalScroll="center"
        onCellClick={copyCellText}
        useColumnSizeAsMinWidth
        widthMode="content"
      />
      {toastMessage && (
        <CopyToast role="status" aria-live="polite">
          {toastMessage}
        </CopyToast>
      )}
    </>
  );
};

export default OverviewCopyableTable;
