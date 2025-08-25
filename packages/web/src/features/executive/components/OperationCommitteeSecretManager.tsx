import React from "react";

import { useOperationCommitteeSecret } from "../hooks/useOperationCommitteeSecret";

export const OperationCommitteeSecretManager = () => {
  console.log("🔍 Environment:", process.env.NODE_ENV);
  console.log("🔍 Current URL:", window.location.origin);
  console.log("🔍 API_URL from env:", process.env.NEXT_PUBLIC_API_URL);

  const {
    currentKey,
    isLoading,
    error,
    createSecretKey,
    deleteSecretKey,
    refetch,
  } = useOperationCommitteeSecret();

  const handleCreateKey = async () => {
    const confirmMessage = currentKey
      ? "기존 비밀키를 새로운 키로 교체하시겠습니까?\n기존 링크는 사용할 수 없게 됩니다."
      : "새 비밀키를 생성하시겠습니까?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await createSecretKey();
      window.alert(
        currentKey ? "비밀키가 갱신되었습니다." : "새 비밀키가 생성되었습니다.",
      );
    } catch (createError: unknown) {
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("비밀키 생성 실패:", createError);
      }
      window.alert("비밀키 생성에 실패했습니다.");
    }
  };

  const handleDeleteKey = async () => {
    if (
      !window.confirm(
        "정말로 비밀키를 삭제하시겠습니까?\n운영위원들이 활동보고서에 접근할 수 없게 됩니다.",
      )
    ) {
      return;
    }

    try {
      await deleteSecretKey();
      window.alert("비밀키가 삭제되었습니다.");
    } catch (deleteError: unknown) {
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("비밀키 삭제 실패:", deleteError);
      }
      window.alert("비밀키 삭제에 실패했습니다.");
    }
  };

  const generateAccessUrl = () => {
    if (!currentKey) return "";

    // TODO: 실제 운영위원 페이지 URL 구조에 맞게 수정 필요
    const baseUrl = window.location.origin;
    return `${baseUrl}/operating-committee/5425?operating-committee-secret=${currentKey}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      window.alert("링크가 클립보드에 복사되었습니다.");
    } catch (copyError: unknown) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("복사 실패:", copyError);
      }
      window.alert("복사에 실패했습니다.");
    }
  };

  return (
    <div className="bg-white">
      <div className="space-y-6">
        {/* 상태 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              ⚠️ 비밀키 조회에 실패했습니다.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">⏳ 처리 중입니다...</p>
          </div>
        )}

        {/* 현재 비밀키 정보 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-cyan-500 px-4 py-3">
            <h4 className="text-white font-medium">현재 비밀키</h4>
          </div>
          <div className="p-4">
            <div className="font-mono text-base bg-gray-50 p-3 rounded border">
              {currentKey ? (
                <span className="text-gray-900 font-semibold">
                  {currentKey}
                </span>
              ) : (
                <span className="text-gray-500">설정된 비밀키가 없습니다</span>
              )}
            </div>
          </div>
        </div>

        {/* 접속 링크 - 비밀키가 있을 때만 표시 */}
        {currentKey && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-cyan-500 px-4 py-3">
              <h4 className="text-white font-medium">운영위원 접속 링크</h4>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generateAccessUrl()}
                  readOnly
                  className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded bg-gray-50 font-mono text-blue-600"
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(generateAccessUrl())}
                  className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors text-sm font-medium disabled:opacity-50"
                  disabled={isLoading}
                >
                  복사
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                이 링크를 운영위원들에게 공유하세요.
              </p>
            </div>
          </div>
        )}

        {/* 관리 버튼들 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCreateKey}
            disabled={isLoading}
            className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {currentKey ? "비밀키 갱신" : "새 비밀키 생성"}
          </button>

          {currentKey && (
            <button
              type="button"
              onClick={handleDeleteKey}
              disabled={isLoading}
              className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              비밀키 삭제
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationCommitteeSecretManager;
