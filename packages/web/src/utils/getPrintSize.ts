import { PromotionalPrintingSizeEnum } from "@clubs/interface/common/enum/promotionalPrinting.enum";

const getPrintSize = (type: PromotionalPrintingSizeEnum): string => {
  switch (type) {
    case PromotionalPrintingSizeEnum.A4:
      return "A4";
    case PromotionalPrintingSizeEnum.A3:
      return "A3";
    default:
      return "None";
  }
};

export default getPrintSize;
