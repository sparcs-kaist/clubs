import React from "react";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

interface SecretKeySectionProps {
  currentKey: string | null;
  onCopy: (text: string) => void;
  isLoading: boolean;
}

const SecretKeySection: React.FC<SecretKeySectionProps> = ({
  currentKey,
  onCopy,
  isLoading,
}) => (
  <FlexWrapper
    direction="column"
    gap={8}
    style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}
  >
    <div style={{ fontWeight: 600 }}>현재 비밀키</div>
    {currentKey ? (
      <>
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
            onClick={() => onCopy(currentKey)}
          >
            키 복사
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
        비밀키가 설정되지 않았습니다.
        <br />
        우측 상단의 비밀키 생성 버튼을 눌러 새로운 비밀키를 생성해주세요.
      </div>
    )}
  </FlexWrapper>
);

export default SecretKeySection;
