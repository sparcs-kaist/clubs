import React from "react";

interface ErrorMessageProps {
  show: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ show }) =>
  show ? (
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
  ) : null;

export default ErrorMessage;
