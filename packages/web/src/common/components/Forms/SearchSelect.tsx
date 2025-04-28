import { hangulIncludes } from "es-hangul";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import FormError from "../FormError";
import Label from "../FormLabel";
import NoOption from "../Select/_atomic/NoOption";
import SelectOption from "../Select/SelectOption";

export interface SearchSelectItem<T> {
  label: string;
  value: T;
  selectable?: boolean;
}

interface SearchSelectProps<T> {
  items: SearchSelectItem<T>[];
  label?: string;
  errorMessage?: string;
  disabled?: boolean;
  value?: T | null;
  onChange?: (value: T | null) => void;
  setErrorStatus?: (hasError: boolean) => void;
  placeholder?: string;
  required?: boolean;
}

const SelectWrapper = styled.div`
  width: 100%;
  flex-direction: column;
  display: flex;
  gap: 4px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  font-size: 16px;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.PRIMARY};
  }
`;

const DropdownWrapper = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;
  margin-top: 4px;
  background-color: ${({ theme }) => theme.colors.WHITE};
`;

const SearchSelect = <T,>({
  items,
  errorMessage = "",
  label = "",
  disabled = false,
  value,
  onChange = () => {},
  setErrorStatus = () => {},
  placeholder = "검색어를 입력해주세요",
  required = true,
}: SearchSelectProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter(
    item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hangulIncludes(item.label, searchTerm),
  );

  useEffect(() => {
    setErrorStatus(!!errorMessage || (value == null && items.length > 0));
  }, [errorMessage, value, items.length, setErrorStatus]);

  const handleOptionClick = (item: SearchSelectItem<T>) => {
    if (item.selectable || item.selectable === undefined) {
      onChange(item.value);
      setSearchTerm(item.label);
      setHasOpenedOnce(true);
      setIsDropdownOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onChange(null);
    setHasOpenedOnce(true);
    setIsDropdownOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          if (items.length > 0 && value == null) {
            setHasOpenedOnce(true);
          }
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef, isDropdownOpen, items.length, value]);

  return (
    <SelectWrapper ref={containerRef}>
      {label && <Label>{label}</Label>}
      <SearchInput
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        disabled={disabled}
      />
      {isDropdownOpen && (
        <DropdownWrapper>
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <SelectOption
                key={item.value as string}
                selectable={item.selectable || item.selectable === undefined}
                onClick={() => {
                  handleOptionClick(item);
                }}
              >
                {item.label}
              </SelectOption>
            ))
          ) : (
            <NoOption>검색 결과가 없습니다</NoOption>
          )}
        </DropdownWrapper>
      )}
      {required && hasOpenedOnce && !value && items.length > 0 && (
        <FormError>
          {errorMessage || "필수로 선택해야 하는 항목입니다"}
        </FormError>
      )}
    </SelectWrapper>
  );
};

export default SearchSelect;
