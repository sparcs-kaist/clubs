"use client";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import { useOperationCommitteeSecret } from "@sparcs-clubs/web/features/executive/hooks/useOperationCommitteeSecret";

import AccessLinkSection from "./AccessLinkSection";
import ErrorMessage from "./ErrorMessage";
import HeaderButtons from "./HeaderButtons";
import SecretKeySection from "./SecretKeySection";

const OperationCommitteeSecretManager: React.FC = () => {
  const {
    currentKey: hookCurrentKey,
    isLoading,
    error,
    createSecretKey,
    deleteSecretKey,
    refetch,
  } = useOperationCommitteeSecret();

  const [currentKey, setCurrentKey] = useState<string | null>(hookCurrentKey);

  useEffect(() => {
    setCurrentKey(hookCurrentKey);
  }, [hookCurrentKey]);

  const isNotFound =
    axios.isAxiosError(error) && error.response?.status === 404;
  const boundaryError = !!error && !isNotFound;

  const accessUrl = useMemo(() => {
    if (typeof window === "undefined" || !currentKey) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/operating-committee/activity-report/5425?operating-committee-secret=${currentKey}`;
  }, [currentKey]);

  const handleCreateKey = async () => {
    if (!window.confirm("새 비밀키를 생성하시겠습니까?")) return;

    try {
      const response = await createSecretKey();
      if (response?.createdKey?.secretKey) {
        setCurrentKey(response.createdKey.secretKey);
      }
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
      const response = await createSecretKey();
      if (response?.createdKey?.secretKey) {
        setCurrentKey(response.createdKey.secretKey);
      }
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
      setCurrentKey(null);
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
        {/* 헤더 */}
        <FlexWrapper
          direction="row"
          justify="space-between"
          style={{ alignItems: "center" }}
        >
          <SectionTitle>운영위원 비밀키 관리</SectionTitle>
          <HeaderButtons
            currentKey={currentKey}
            isLoading={isLoading}
            onRefetch={refetch}
            onCreateKey={handleCreateKey}
            onDeleteKey={handleDeleteKey}
            onUpdateKey={handleUpdateKey}
          />
        </FlexWrapper>

        {/* 에러 메시지 */}
        <ErrorMessage show={!!error && !isNotFound} />

        {/* 현재 비밀키 */}
        <SecretKeySection
          currentKey={currentKey}
          onCopy={copyToClipboard}
          isLoading={isLoading}
        />

        {/* 접속 링크 */}
        <AccessLinkSection
          currentKey={currentKey}
          accessUrl={accessUrl}
          onCopy={copyToClipboard}
          isLoading={isLoading}
        />
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default OperationCommitteeSecretManager;
