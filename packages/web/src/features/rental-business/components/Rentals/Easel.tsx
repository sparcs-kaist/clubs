import React from "react";

import FormController from "@sparcs-clubs/web/common/components/FormController";
import ItemNumberInput from "@sparcs-clubs/web/common/components/Forms/ItemNumberInput";
import { RentalLimitProps } from "@sparcs-clubs/web/features/rental-business/frames/RentalNoticeFrame";
import { getMaxRental } from "@sparcs-clubs/web/features/rental-business/utils/getMaxRental";

const Easel: React.FC<RentalLimitProps> = ({ availableRentals, formCtx }) => (
  <FormController
    name="easel"
    control={formCtx.control}
    renderItem={props => (
      <ItemNumberInput
        {...props}
        label="이젤 개수"
        placeholder="0개"
        itemLimit={getMaxRental(availableRentals, "easel")}
      />
    )}
  />
);

export default Easel;
