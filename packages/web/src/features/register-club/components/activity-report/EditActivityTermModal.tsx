import React, { useCallback, useMemo, useState } from "react";

import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { Duration } from "@sparcs-clubs/web/features/register-club/types/registerClub";
import { formatDotDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import {
  getLocalDateLastTime,
  getLocalDateOnly,
} from "@sparcs-clubs/web/utils/Date/getKSTDate";

import ActivityTermRow from "./_atomic/ActivityTermRow";

export interface ActivityTermProps {
  startDate: string;
  endDate: string;
}

interface EditActivityTermModalProps {
  initialData: Duration[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (terms: Duration[]) => void;
}

const EditActivityTermModal: React.FC<EditActivityTermModalProps> = ({
  initialData,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [activityTermList, setActivityTermList] = useState<ActivityTermProps[]>(
    initialData.map(d => ({
      startDate: formatDotDate(d.startTerm),
      endDate: formatDotDate(d.endTerm),
    })),
  );
  const [hasErrorList, setHasErrorList] = useState<boolean[]>(
    Array.from({ length: initialData.length }, () => false),
  );

  const addRow = useCallback(() => {
    setActivityTermList(prevList => [
      ...prevList,
      { startDate: "", endDate: "" },
    ]);
    setHasErrorList(prevList => [...prevList, false]);
  }, []);

  const handleDelete = useCallback(
    (index: number) => {
      const updatedTerms = activityTermList.filter((_, i) => i !== index);
      const updatedErrorList = hasErrorList.filter((_, i) => i !== index);
      setActivityTermList(updatedTerms);
      setHasErrorList(updatedErrorList);
    },
    [activityTermList, hasErrorList],
  );

  const handleDateChange = useCallback(
    (index: number, start: string, end: string) => {
      const updatedTerms = activityTermList.map((term, i) =>
        i === index ? { startDate: start, endDate: end } : term,
      );
      setActivityTermList(updatedTerms);
    },
    [activityTermList],
  );

  const handleHasErrorList = useCallback(
    (index: number, hasError: boolean) => {
      setHasErrorList(prevErrorList => {
        if (prevErrorList[index] !== hasError) {
          const updatedErrorList = prevErrorList.map((error, i) =>
            i === index ? hasError : error,
          );
          return updatedErrorList;
        }
        return prevErrorList;
      });
    },
    [hasErrorList],
  );

  const isEmpty = useMemo(
    () => activityTermList.length === 0,
    [activityTermList],
  );

  const isSomethingEmpty = useMemo(() => {
    if (activityTermList.length === 0) {
      return false;
    }
    return activityTermList.some(
      term => term.startDate === "" || term.endDate === "",
    );
  }, [activityTermList]);

  const checkError = useMemo(
    () => hasErrorList.some(error => error),
    [hasErrorList],
  );

  const handleConfirm = useCallback(() => {
    if (isEmpty || isSomethingEmpty || checkError) return;

    onConfirm(
      activityTermList.map(term => ({
        startTerm: getLocalDateOnly(term.startDate),
        endTerm: getLocalDateLastTime(term.endDate),
      })),
    );
  }, [activityTermList, isEmpty, isSomethingEmpty, checkError, onConfirm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CancellableModalContent onClose={onClose} onConfirm={handleConfirm}>
        <FlexWrapper
          direction="column"
          gap={12}
          style={{ width: "min(600px, 80vw)" }}
        >
          {activityTermList.map((term, index) => (
            <ActivityTermRow
              key={index}
              index={index}
              startDate={term.startDate}
              endDate={term.endDate}
              onDateChange={handleDateChange}
              onDelete={handleDelete}
              onError={handleHasErrorList}
            />
          ))}
          <IconButton
            icon="add"
            onClick={addRow}
            style={{ backgroundColor: "white", color: "black" }}
            type="outlined"
          >
            활동 기간 추가
          </IconButton>
          {isEmpty && (
            <Typography fw="MEDIUM" fs={12} lh={18} color="RED.600">
              기간을 하나 이상 추가해주세요.
            </Typography>
          )}
          {isSomethingEmpty && (
            <Typography fw="MEDIUM" fs={12} lh={18} color="RED.600">
              기간을 입력하거나 해당 항목을 삭제해주세요.
            </Typography>
          )}
        </FlexWrapper>
      </CancellableModalContent>
    </Modal>
  );
};

export default EditActivityTermModal;
