import { ApiRnt001ResponseOK } from "@clubs/interface/api/rental/endpoint/apiRnt001";

import { RentalInterface } from "../types/rental";
import { getMaxRental } from "./getMaxRental";

export const getRentalList = (
  value: "easel" | "vacuum" | "handCart" | "mat" | "tool" | "all",
  rental: RentalInterface,
  availableRentals: ApiRnt001ResponseOK,
) => {
  const itemList: string[] = [];

  if (
    (value === "easel" || value === "all") &&
    rental.easel &&
    rental.easel > 0 &&
    getMaxRental(availableRentals, "easel") >= rental.easel
  ) {
    itemList.push(`이젤 ${rental.easel}개`);
  }

  if (
    (value === "vacuum" || value === "all") &&
    rental.vacuum &&
    ((rental.vacuum === "corded" &&
      getMaxRental(availableRentals, "Vacuum Corded") > 0) ||
      (rental.vacuum === "cordless" &&
        getMaxRental(availableRentals, "Vacuum Cordless") > 0))
  ) {
    itemList.push(`${rental.vacuum === "corded" ? "유선" : "무선"} 청소기`);
  }

  if (rental.handCart && (value === "handCart" || value === "all")) {
    if (
      rental.handCart.rolltainer &&
      rental.handCart.rolltainer > 0 &&
      getMaxRental(availableRentals, "Hand Cart Rolltainer") >=
        rental.handCart.rolltainer
    ) {
      itemList.push(`수레 > 롤테이너 ${rental.handCart.rolltainer}개`);
    }
    if (
      rental.handCart.large &&
      rental.handCart.large > 0 &&
      getMaxRental(availableRentals, "Hand Cart Large") >= rental.handCart.large
    ) {
      itemList.push(`수레 > 대형 ${rental.handCart.large}개`);
    }
    if (
      rental.handCart.medium &&
      rental.handCart.medium > 0 &&
      getMaxRental(availableRentals, "Hand Cart Medium") >=
        rental.handCart.medium
    ) {
      itemList.push(`수레 > 중형 ${rental.handCart.medium}개`);
    }
    if (
      rental.handCart.small &&
      rental.handCart.small > 0 &&
      getMaxRental(availableRentals, "Hand Cart Small") >= rental.handCart.small
    ) {
      itemList.push(`수레 > 소형 ${rental.handCart.small}개`);
    }
  }

  if (
    (value === "mat" || value === "all") &&
    rental.mat &&
    rental.mat > 0 &&
    getMaxRental(availableRentals, "Mat") >= rental.mat
  ) {
    itemList.push(`돗자리 ${rental.mat}개`);
  }

  if (rental.tool && (value === "tool" || value === "all")) {
    if (
      rental.tool.powerDrill &&
      rental.tool.powerDrill > 0 &&
      getMaxRental(availableRentals, "Power Drill") >= rental.tool.powerDrill
    ) {
      itemList.push(`공구 > 전동 드릴 세트 ${rental.tool.powerDrill}개`);
    }
    if (
      rental.tool.driver &&
      rental.tool.driver > 0 &&
      getMaxRental(availableRentals, "Driver") >= rental.tool.driver
    ) {
      itemList.push(`공구 > 드라이버 세트 ${rental.tool.driver}개`);
    }
    if (
      rental.tool.superGlue &&
      rental.tool.superGlue > 0 &&
      getMaxRental(availableRentals, "Super Glue") >= rental.tool.superGlue
    ) {
      itemList.push(`공구 > 순간접착제 ${rental.tool.superGlue}개`);
    }
    if (
      rental.tool.nipper &&
      rental.tool.nipper > 0 &&
      getMaxRental(availableRentals, "Nipper") >= rental.tool.nipper
    ) {
      itemList.push(`공구 > 니퍼 ${rental.tool.nipper}개`);
    }
    if (
      rental.tool.plier &&
      rental.tool.plier > 0 &&
      getMaxRental(availableRentals, "Plier") >= rental.tool.plier
    ) {
      itemList.push(`공구 > 펜치 ${rental.tool.plier}개`);
    }
    if (
      rental.tool.longNosePlier &&
      rental.tool.longNosePlier > 0 &&
      getMaxRental(availableRentals, "Long Nose Plier") >=
        rental.tool.longNosePlier
    ) {
      itemList.push(`공구 > 롱노우즈 ${rental.tool.longNosePlier}개`);
    }
  }
  return itemList;
};

export const isCurrentItemEmpty = (
  value: "none" | "easel" | "vacuum" | "handCart" | "mat" | "tool",
  currentValues: RentalInterface,
  availableRentals: ApiRnt001ResponseOK,
) => {
  if (value === "none") return true;
  return getRentalList(value, currentValues, availableRentals).length === 0;
};

export const isRentalListEmpty = (
  currentValues: RentalInterface,
  availableRentals: ApiRnt001ResponseOK,
) => getRentalList("all", currentValues, availableRentals).length === 0;
