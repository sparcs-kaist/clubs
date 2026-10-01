import React from "react";
import styled from "styled-components";

import Dropdown from "@sparcs-clubs/web/common/components/Select/Dropdown";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { CategoryProps } from "../types/FilterCategories";
import { DetailFilter } from "./DetailFilter";

const CategoryNameWithContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  align-self: stretch;
`;

const MultiFilterDropdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 4px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  align-self: stretch;
`;

interface MultiFilterDropdownProps {
  categories: CategoryProps[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryProps[]>>;
}

const MultiFilterDropdown: React.FC<MultiFilterDropdownProps> = ({
  categories,
  setCategories,
}) => {
  const assembleCategories = (name: string, newCategory: CategoryProps) => {
    setCategories(oldCategories =>
      oldCategories.map(category =>
        category.name === name ? newCategory : category,
      ),
    );
  };

  return (
    <Dropdown marginTop={40} maxContent style={{ maxHeight: 400 }}>
      <MultiFilterDropdownWrapper>
        {categories.map(element => (
          <CategoryNameWithContent key={element.name}>
            <Typography>{element.name}</Typography>
            <DetailFilter category={element} setCategory={assembleCategories} />
          </CategoryNameWithContent>
        ))}
      </MultiFilterDropdownWrapper>
    </Dropdown>
  );
};

export default MultiFilterDropdown;
