import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";

import apiAct031 from "@clubs/interface/api/activity/endpoint/apiAct031";
import apiFnd017 from "@clubs/interface/api/funding/endpoint/apiFnd017";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";
import { formatDotDetailDate } from "@sparcs-clubs/web/utils/Date/formatDate";

import getReviewChangeRows from "../utils/reviewChangeRows";

const HistoryDialog = styled.dialog`
  width: min(960px, calc(100% - 24px));
  max-height: 90vh;
  max-height: 90dvh;
  margin: auto;
  border: 0;
  border-radius: ${({ theme }) => theme.round.md};
  box-shadow: ${({ theme }) => theme.shadow.md};
  padding: 20px;
  overflow: hidden;

  &::backdrop {
    background: rgba(85, 85, 85, 0.25);
  }

  &[open] {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: ${({ theme }) => theme.fonts.WEIGHT.SEMIBOLD};
  }
`;

const TableScroll = styled.div`
  overflow: auto;
  min-height: 0;
`;

const ComparisonTable = styled.table`
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  line-height: 20px;

  th,
  td {
    padding: 8px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  thead th {
    position: sticky;
    top: 0;
    background: ${({ theme }) => theme.colors.GRAY[100]};
  }

  th:first-child {
    width: 24%;
  }

  td {
    white-space: pre-wrap;
  }

  tr[data-changed="true"] td {
    background: ${({ theme }) => theme.colors.MINT[100]};
  }
`;

interface ReviewChangeHistoryButtonProps {
  kind: "activity" | "funding";
  id: number;
}

const ReviewChangeHistoryModal = ({
  kind,
  id,
  onClose,
}: ReviewChangeHistoryButtonProps & { onClose: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const [index, setIndex] = useState(0);
  const api = kind === "activity" ? apiAct031 : apiFnd017;
  const url = api.url(id);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [url],
    queryFn: async () => {
      const response = await axiosClientWithAuth.get(url, {
        // Snapshot text must stay unchanged even when it looks like a date.
        transformResponse: axios.defaults.transformResponse,
      });
      return api.responseBodyMap[200].parse(response.data);
    },
  });
  const count = data?.length ?? 0;
  const selectedIndex = Math.min(index, Math.max(count - 1, 0));
  const version = data?.[selectedIndex];
  const rows = version
    ? getReviewChangeRows(kind, version.before, version.after)
    : [];

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    headingRef.current?.focus();
    return () => dialog?.close();
  }, []);

  return (
    <HistoryDialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <FlexWrapper
        gap={12}
        justify="space-between"
        style={{ alignItems: "center" }}
      >
        <h2 id={headingId} ref={headingRef} tabIndex={-1}>
          변경 이력
        </h2>
        <Button type="outlined" onClick={onClose}>
          닫기
        </Button>
      </FlexWrapper>
      <AsyncBoundary
        isLoading={isLoading}
        isError={isError && !data}
        renderIfError={
          <FlexWrapper gap={12} style={{ alignItems: "center" }}>
            <Typography role="alert">
              변경 이력을 불러오지 못했습니다.
            </Typography>
            <Button type="outlined" onClick={() => refetch()}>
              다시 시도
            </Button>
          </FlexWrapper>
        }
      >
        {version ? (
          <>
            <Typography aria-live="polite">
              {formatDotDetailDate(version.createdAt)} · 최신순{" "}
              {selectedIndex + 1}/{count}건
              {rows.every(row => !row.changed) && " · 변경된 항목 없음"}
            </Typography>
            <TableScroll key={version.id}>
              <ComparisonTable aria-label="항목별 변경 전후 비교">
                <thead>
                  <tr>
                    <th scope="col">항목</th>
                    <th scope="col">이전 버전</th>
                    <th scope="col">
                      {selectedIndex === 0 ? "현재 버전" : "수정 후 버전"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.key} data-changed={row.changed}>
                      <th scope="row">
                        {row.label}
                        {row.changed && (
                          <Typography color="MINT.800" fs={12}>
                            변경됨
                          </Typography>
                        )}
                      </th>
                      <td>{row.before}</td>
                      <td>{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </ComparisonTable>
            </TableScroll>
            <FlexWrapper gap={8} justify="space-between">
              <Button
                type={selectedIndex < count - 1 ? "outlined" : "disabled"}
                onClick={() => setIndex(selectedIndex + 1)}
              >
                ← 과거 변경
              </Button>
              <Button
                type={selectedIndex > 0 ? "outlined" : "disabled"}
                onClick={() => setIndex(selectedIndex - 1)}
              >
                최근 변경 →
              </Button>
            </FlexWrapper>
          </>
        ) : (
          <Typography color="GRAY.600">저장된 변경 이력이 없습니다.</Typography>
        )}
      </AsyncBoundary>
    </HistoryDialog>
  );
};

const ReviewChangeHistoryButton = (props: ReviewChangeHistoryButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="outlined" onClick={() => setIsOpen(true)}>
        변경 이력 보기
      </Button>
      {isOpen && (
        <ReviewChangeHistoryModal {...props} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default ReviewChangeHistoryButton;
