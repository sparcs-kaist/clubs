import React from "react";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

interface HeaderButtonsProps {
  currentKey: string | null;
  isLoading: boolean;
  onRefetch: () => void;
  onCreateKey: () => void;
  onDeleteKey: () => void;
  onUpdateKey: () => void;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({
  currentKey,
  isLoading,
  onRefetch,
  onCreateKey,
  onDeleteKey,
  onUpdateKey,
}) => (
  <FlexWrapper gap={8}>
    {/* 비밀키가 있을 때만 새로고침 버튼 표시 */}
    {currentKey && (
      <Button type="default" onClick={onRefetch}>
        새로고침
      </Button>
    )}
    {/* 비밀키가 없으면 생성 버튼만, 있으면 삭제와 갱신 버튼 */}
    {!currentKey ? (
      <Button type={isLoading ? "disabled" : "default"} onClick={onCreateKey}>
        비밀키 생성
      </Button>
    ) : (
      <>
        <Button type={isLoading ? "disabled" : "default"} onClick={onDeleteKey}>
          비밀키 삭제
        </Button>
        <Button type={isLoading ? "disabled" : "default"} onClick={onUpdateKey}>
          비밀키 갱신
        </Button>
      </>
    )}
  </FlexWrapper>
);

export default HeaderButtons;
