import React, { useState } from "react";
import styled from "styled-components";

import DetailFilterButton from "./DetailFilterButton";
import DetailFilterDropdown from "./DetailFilterDropdown";

const DetailFilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
`;

interface CategoryProps {
  name: string;
  content: string[];
  selectedContent: string[];
}

interface DetailFilterProps {
  category: CategoryProps;
  setCategory: (name: string, newCategory: CategoryProps) => void;
}

export const DetailFilter: React.FC<DetailFilterProps> = ({
  category,
  setCategory,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const setSelectedContents: React.Dispatch<
    React.SetStateAction<string[]>
  > = next => {
    setCategory(category.name, {
      ...category,
      selectedContent:
        typeof next === "function" ? next(category.selectedContent) : next,
    });
  };
  // TODO: filter 아닌 곳 클릭했을 때 닫히게 하기
  return (
    <DetailFilterWrapper>
      <DetailFilterButton
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        category={category}
      />
      {isOpen && (
        <DetailFilterDropdown
          category={category}
          setSelectedContents={setSelectedContents}
        />
      )}
    </DetailFilterWrapper>
  );
};
