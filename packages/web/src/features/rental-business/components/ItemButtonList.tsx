import React from "react";
import styled from "styled-components";

import { ApiRnt001ResponseOK } from "@clubs/interface/api/rental/endpoint/apiRnt001";

import { RentalInterface } from "../types/rental";
import { isCurrentItemEmpty } from "../utils/isRentalEmpty";
import ItemButton from "./ItemButton";

interface ItemButtonListProps {
  value: "easel" | "vacuum" | "handCart" | "mat" | "tool" | "none";
  onChange: (value: "easel" | "vacuum" | "handCart" | "mat" | "tool") => void;
  currentValues: RentalInterface;
  availableRentals: ApiRnt001ResponseOK;
}

const ItemButtonListInner = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 20px;
  align-self: stretch;
  flex-wrap: wrap;
`;

const buttonInfo = {
  easel: {
    text: "이젤",
    image: "https://via.placeholder.com/150",
  },
  vacuum: {
    text: "청소기",
    image: "https://via.placeholder.com/150",
  },
  handCart: {
    text: "수레",
    image: "https://via.placeholder.com/150",
  },
  mat: {
    text: "돗자리",
    image: "https://via.placeholder.com/150",
  },
  tool: {
    text: "공구",
    image: "https://via.placeholder.com/150",
  },
};

const ItemButtonList: React.FC<ItemButtonListProps> = ({
  currentValues,
  value,
  onChange,
  availableRentals,
}) => (
  <ItemButtonListInner>
    {Object.keys(buttonInfo).map(key => {
      const hasItem = !isCurrentItemEmpty(
        key as keyof typeof buttonInfo,
        currentValues,
        availableRentals,
      );

      return (
        <ItemButton
          key={key}
          selected={value === key}
          name={buttonInfo[key as keyof typeof buttonInfo].text}
          image={buttonInfo[key as keyof typeof buttonInfo].image}
          have={hasItem}
          onClick={() => onChange(key as keyof typeof buttonInfo)}
        />
      );
    })}
  </ItemButtonListInner>
);

export default ItemButtonList;
