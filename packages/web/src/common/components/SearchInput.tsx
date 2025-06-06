import React, { ChangeEvent } from "react";
import styled from "styled-components";

import Icon from "./Icon";

interface SearchInputProps {
  searchText: string;
  handleChange?: (value: string) => void;
  placeholder?: string;
}

const SearchInputWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.WHITE};
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  align-items: center;
  flex: 1;
  &:hover {
    border-color: ${({ theme }) => theme.colors.GRAY[300]};
  }
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.PRIMARY};
  }
`;

const Input = styled.input`
  display: flex;
  flex-direction: row;
  flex: 1;
  outline: none;
  border: none;
  font-family: ${({ theme }) => theme.fonts.FAMILY.PRETENDARD};
  font-size: 16px;
  line-height: 20px;
  font-weight: ${({ theme }) => theme.fonts.WEIGHT.REGULAR};
  color: ${({ theme }) => theme.colors.BLACK};
  &::placeholder {
    color: ${({ theme }) => theme.colors.GRAY[200]};
  }
`;

const SearchInput: React.FC<SearchInputProps> = ({
  searchText,
  handleChange = () => {},
  placeholder = "회원 이름을 검색하세요",
}) => {
  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    handleChange(inputValue);
  };
  return (
    <SearchInputWrapper>
      <Icon type="search" size={20} />
      <Input
        value={searchText}
        placeholder={placeholder}
        onChange={handleValueChange}
      />
    </SearchInputWrapper>
  );
};

export default SearchInput;
