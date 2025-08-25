"use client";

import axios from "axios";
import React, { useMemo } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";

import { useOperationCommitteeSecret } from "../hooks/useOperationCommitteeSecret";

const OperationCommitteeSecretManager: React.FC = () => {
  const {
    currentKey,
    secretData,
    isLoading,
    error,
    createSecretKey,
    deleteSecretKey,
    refetch,
  } = useOperationCommitteeSecret();

  const isNotFound =
    axios.isAxiosError(error) && error.response?.status === 404;
  const boundaryError = !!error && !isNotFound;

  const accessUrl = useMemo(() => {
    if (typeof window === "undefined" || !currentKey) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/operating-committee/5425?operating-committee-secret=${currentKey}`;
  }, [currentKey]);

  const handleCreateKey = async () => {
    if (!window.confirm("새 비밀키를 생성하시겠습니까?")) return;

    try {
      await createSecretKey();
      refetch();
      window.alert("새 비밀키가 생성되었습니다.");
    } catch (e) {
      if (process.env.NODE_ENV === "development")
        console.error("비밀키 생성 실패:", e);
      window.alert("비밀키 생성에 실패했습니다.");
    }
  };

  const handleUpdateKey = async () => {
    if (
      !window.confirm(
        "기존 비밀키를 새로운 키로 교체하시겠습니까?\n기존 링크는 사용할 수 없게 됩니다.",
      )
    )
      return;

    try {
      await createSecretKey();
      refetch();
      window.alert("비밀키가 갱신되었습니다.");
    } catch (e) {
      if (process.env.NODE_ENV === "development")
        console.error("비밀키 갱신 실패:", e);
      window.alert("비밀키 갱신에 실패했습니다.");
    }
  };

  const handleDeleteKey = async () => {
    if (
      !window.confirm(
        "정말로 비밀키를 삭제하시겠습니까?\n운영위원들이 활동보고서에 접근할 수 없게 됩니다.",
      )
    )
      return;

    try {
      await deleteSecretKey();
      refetch();
      window.alert("비밀키가 삭제되었습니다.");
    } catch (e) {
      if (process.env.NODE_ENV === "development")
        console.error("비밀키 삭제 실패:", e);
      window.alert("비밀키 삭제에 실패했습니다.");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      window.alert("복사되었습니다.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      window.alert("복사되었습니다.");
    }
  };

  return (
    <AsyncBoundary isLoading={isLoading} isError={boundaryError}>
      <FlexWrapper direction="column" gap={20} style={{ alignSelf: "stretch" }}>
        <FlexWrapper
          direction="row"
          justify="space-between"
          style={{ alignItems: "center" }}
        >
          <SectionTitle>운영위원 비밀키 관리</SectionTitle>
          <FlexWrapper gap={8}>
            {currentKey && (
              <Button type="default" onClick={() => refetch()}>
                새로고침
              </Button>
            )}
            {!currentKey ? (
              <Button
                type={isLoading ? "disabled" : "default"}
                onClick={handleCreateKey}
              >
                비밀키 생성
              </Button>
            ) : (
              <>
                <Button
                  type={isLoading ? "disabled" : "default"}
                  onClick={handleDeleteKey}
                >
                  비밀키 삭제
                </Button>
                <Button
                  type={isLoading ? "disabled" : "default"}
                  onClick={handleUpdateKey}
                >
                  비밀키 갱신
                </Button>
              </>
            )}
          </FlexWrapper>
        </FlexWrapper>

        {!!error && !isNotFound && (
          <div
            style={{
              border: "1px solid #FCA5A5",
              background: "#FEF2F2",
              color: "#B91C1C",
              padding: 12,
              borderRadius: 8,
            }}
          >
            ⚠️ 비밀키 조회에 실패했습니다.
          </div>
        )}

        {currentKey && (
          <FlexWrapper
            direction="column"
            gap={8}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600 }}>현재 비밀키</div>
            <div
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "10px 12px",
                color: "#111827",
                overflowX: "auto",
              }}
            >
              {currentKey}
            </div>
            <FlexWrapper gap={8}>
              <Button
                type={isLoading ? "disabled" : "default"}
                onClick={() => copyToClipboard(currentKey)}
              >
                키 복사
              </Button>
            </FlexWrapper>
          </FlexWrapper>
        )}

        {currentKey && (
          <FlexWrapper
            direction="column"
            gap={8}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 600 }}>운영위원 접속 링크</div>
            <input
              type="text"
              readOnly
              value={accessUrl}
              onClick={e => (e.target as HTMLInputElement).select()}
              style={{
                width: "100%",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "10px 12px",
                color: "#1D4ED8",
                cursor: "text",
              }}
            />
            <FlexWrapper gap={8}>
              <Button
                type={isLoading ? "disabled" : "default"}
                onClick={() => copyToClipboard(accessUrl)}
              >
                링크 복사
              </Button>
            </FlexWrapper>
          </FlexWrapper>
        )}

        {process.env.NODE_ENV === "development" && secretData && (
          <div style={{ fontSize: 12, color: "#6B7280" }}>
            (dev) activeKey 개수: {secretData.activeKey?.length ?? 0}
          </div>
        )}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default OperationCommitteeSecretManager;
