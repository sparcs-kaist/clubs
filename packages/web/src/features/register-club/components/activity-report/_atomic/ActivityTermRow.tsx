import React, { useState } from "react";

import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import DateRangeInput from "@sparcs-clubs/web/common/components/Forms/DateRangeInput";

const ActivityTermRow: React.FC<{
  startDate: string;
  endTerm: string;
  onDateChange: (index: number, start: string, end: string) => void;
  onDelete: (index: number) => void;
  onError: (index: number, hasError: boolean) => void;
  index: number;
}> = ({ startDate, endTerm, onDateChange, onDelete, onError, index }) => {
  const [startMonth, setStartMonth] = useState<string>(startDate);
  const [endMonth, setEndMonth] = useState<string>(endTerm);

  const handleDateChange = (monthString: string) => {
    const start = monthString.split("|")[0];
    const end = monthString.split("|")[1];
    setStartMonth(start);
    setEndMonth(end);
    onDateChange(index, start, end);
  };

  const deleteRow = () => {
    onDelete(index);
  };

  return (
    <FlexWrapper direction="row" gap={8} style={{ alignItems: "center" }}>
      <DateRangeInput
        startValue={startMonth}
        endValue={endMonth}
        limitStartValue="1970.01.01"
        limitEndValue="2030.01.01"
        placeholder="20XX.XX.XX"
        onChange={handleDateChange}
        setErrorStatus={hasError => onError(index, hasError)}
        useDays
      />
      <IconButton
        icon="delete"
        onClick={deleteRow}
        style={{
          backgroundColor: "transparent",
          color: "black",
          alignSelf: "flex-start",
        }}
      />
    </FlexWrapper>
  );
};

export default ActivityTermRow;
