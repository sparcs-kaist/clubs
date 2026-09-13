"use client";

import { FormEvent, useState } from "react";
import styled from "styled-components";

import apiAut005, {
  ApiAut005RequestQuery,
} from "@clubs/interface/api/auth/endpoint/apiAut005";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";

import {
  useExchangeLogin,
  useExchangeLoginUsers,
} from "../services/useExchangeLogin";

const SearchType = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.WHITE};
  color: ${({ theme }) => theme.colors.BLACK};
  font: inherit;
`;

const UserOption = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  cursor: pointer;
  &:has(input:checked) {
    border-color: ${({ theme }) => theme.colors.PRIMARY};
    background: ${({ theme }) => theme.colors.MINT[100]};
  }
`;

const ExchangeLoginFrame = () => {
  const [type, setType] = useState<ApiAut005RequestQuery["type"]>("email");
  const [value, setValue] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [validationError, setValidationError] = useState("");
  const search = useExchangeLoginUsers();
  const exchange = useExchangeLogin();
  const busy = search.isPending || exchange.isPending;
  const selectedUser = search.data?.users.find(user => user.userId === userId);

  const resetSearch = () => {
    search.reset();
    exchange.reset();
    setUserId(null);
    setValidationError("");
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const query = apiAut005.requestQuery.safeParse({ type, value });
    if (!query.success) {
      setValidationError(
        type === "email"
          ? "올바른 이메일을 입력해 주세요."
          : "2147483647 이하의 양의 정수를 입력해 주세요.",
      );
      return;
    }
    resetSearch();
    search.mutate(query.data);
  };

  return (
    <FlexWrapper direction="column" gap={24}>
      <Banner icon="info">
        선택한 계정의 권한으로 로그인하며 접속 이력이 기록됩니다.
        {"\n"}원래 계정으로 돌아오려면 로그아웃 후 SPARCS SSO로 로그인하세요.
      </Banner>
      <form onSubmit={handleSearch}>
        <FlexWrapper direction="column" gap={12}>
          <FlexWrapper as="label" htmlFor="exchange-login-type">
            검색 기준
          </FlexWrapper>
          <SearchType
            id="exchange-login-type"
            value={type}
            disabled={busy}
            onChange={event => {
              setType(event.target.value as ApiAut005RequestQuery["type"]);
              setValue("");
              resetSearch();
            }}
          >
            <option value="email">이메일</option>
            <option value="studentId">학생 ID (studentId)</option>
            <option value="studentNumber">학번</option>
            <option value="professorId">교수 ID (professorId)</option>
          </SearchType>
          <FlexWrapper as="label" htmlFor="exchange-login-value">
            검색어
          </FlexWrapper>
          <TextInput
            id="exchange-login-value"
            placeholder={
              type === "email" ? "이메일을 입력하세요" : "숫자를 입력하세요"
            }
            value={value}
            inputMode={type === "email" ? "email" : "numeric"}
            disabled={busy}
            errorMessage={validationError}
            handleChange={nextValue => {
              setValue(nextValue);
              resetSearch();
            }}
          />
          <Button
            buttonType="submit"
            type={busy || !value.trim() ? "disabled" : "default"}
          >
            {search.isPending ? "검색 중..." : "검색"}
          </Button>
        </FlexWrapper>
      </form>
      <div role="status" aria-live="polite">
        {search.isError && "계정 검색에 실패했습니다. 다시 시도해 주세요."}
        {search.data?.users.length === 0 && "검색 결과가 없습니다."}
      </div>
      {!!search.data?.users.length && (
        <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend>로그인할 계정 선택</legend>
          <FlexWrapper direction="column" gap={8}>
            {search.data.users.map(user => (
              <UserOption key={user.userId}>
                <input
                  type="radio"
                  name="exchange-login-user"
                  value={user.userId}
                  checked={userId === user.userId}
                  onChange={() => setUserId(user.userId)}
                />
                <FlexWrapper direction="column" gap={4}>
                  <Typography fw="MEDIUM">{user.name}</Typography>
                  <Typography>{user.email ?? "이메일 없음"}</Typography>
                  {user.students.map(student => (
                    <Typography key={student.studentId} fs={14}>
                      학번 {student.studentNumber} · 학생 ID {student.studentId}
                    </Typography>
                  ))}
                  {user.professors.map(professor => (
                    <Typography key={professor.professorId} fs={14}>
                      교수 ID {professor.professorId}
                    </Typography>
                  ))}
                </FlexWrapper>
              </UserOption>
            ))}
          </FlexWrapper>
        </fieldset>
      )}
      {selectedUser && (
        <Button
          type={busy ? "disabled" : "default"}
          onClick={() => exchange.mutate({ userId: selectedUser.userId })}
        >
          {exchange.isPending
            ? "로그인 변경 중..."
            : `${selectedUser.name}(으)로 로그인`}
        </Button>
      )}
      {exchange.isError && (
        <Typography role="alert" color="RED.600">
          로그인 변경에 실패했습니다. 계정을 다시 검색한 후 시도해 주세요.
        </Typography>
      )}
    </FlexWrapper>
  );
};

export default ExchangeLoginFrame;
