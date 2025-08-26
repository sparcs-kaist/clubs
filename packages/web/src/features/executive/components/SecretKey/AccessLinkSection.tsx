import React from "react";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

interface AccessLinkSectionProps {
  currentKey: string | null;
  accessUrl: string;
  onCopy: (text: string) => void;
  isLoading: boolean;
}

const AccessLinkSection: React.FC<AccessLinkSectionProps> = ({
  currentKey,
  accessUrl,
  onCopy,
  isLoading,
}) => (
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
    {currentKey ? (
      <>
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
            onClick={() => onCopy(accessUrl)}
          >
            링크 복사
          </Button>
        </FlexWrapper>
      </>
    ) : (
      <div
        style={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 6,
          padding: "20px 12px",
          color: "#6B7280",
          textAlign: "center",
        }}
      >
        비밀키를 먼저 생성하면 운영위원 접속 링크가 여기에 표시됩니다.
      </div>
    )}
  </FlexWrapper>
);

export default AccessLinkSection;
