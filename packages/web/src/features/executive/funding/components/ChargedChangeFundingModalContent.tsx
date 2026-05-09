import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { overlay } from "overlay-kit";
import React, { useCallback, useEffect, useState } from "react";

import apiFnd008 from "@clubs/interface/api/funding/endpoint/apiFnd008";
import apiFnd009 from "@clubs/interface/api/funding/endpoint/apiFnd009";
import apiFnd010 from "@clubs/interface/api/funding/endpoint/apiFnd010";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import useGetFundingClubChargeAvailableExecutives from "../services/useGetFundingClubChargeAvailableExecutives";
import usePatchFundingStatus from "../services/usePatchFundingStatus";
import ChargedChangeFundingModalTable, {
  ChargedChangeFundingProps,
} from "./ChargedChangeFundingModalTable";

interface ChargedChangeFundingModalContentProps {
  isOpen: boolean;
  close: VoidFunction;
  selectedFundingIds: number[];
  selectedFundingInfos: ChargedChangeFundingProps[];
}

interface ChargeableExecutive {
  label: string;
  value: number;
}

const ChargedChangeFundingModalContent: React.FC<
  ChargedChangeFundingModalContentProps
> = ({ isOpen, close, selectedFundingIds, selectedFundingInfos }) => {
  const queryClient = useQueryClient();
  const { id } = useParams();

  const { data, isLoading, isError } =
    useGetFundingClubChargeAvailableExecutives({
      clubIds: [Number(id)],
    });
  const { mutate: patchFundingChargedExecutive } = usePatchFundingStatus();

  const [selectedExecutiveId, setSelectedExecutiveId] = useState<number | null>(
    null,
  );

  const [chargeableExecutives, setChargeableExecutives] = useState<
    ChargeableExecutive[]
  >([]);

  useEffect(() => {
    if (data) {
      setChargeableExecutives(
        data.executives
          .map(executive => ({
            label: `${executive.name} (${executive.studentNumber})`,
            value: executive.id,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
    }
  }, [data]);

  const handleSubmit = useCallback(() => {
    if (selectedExecutiveId === null) return;
    patchFundingChargedExecutive(
      {
        body: {
          fundingIds: selectedFundingIds,
          executiveId: selectedExecutiveId,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [apiFnd008.url()],
          });
          queryClient.invalidateQueries({
            queryKey: [apiFnd009.url(Number(id))],
          });
          queryClient.invalidateQueries({
            queryKey: [apiFnd010.url(selectedExecutiveId)],
          });
          setSelectedExecutiveId(null);
          close();
        },
        onError: () => {
          overlay.open(({ isOpen: opened, close: closeOverlay }) => (
            <Modal isOpen={opened}>
              <ConfirmModalContent onConfirm={closeOverlay}>
                <Typography>담당자 변경에 실패했습니다.</Typography>
              </ConfirmModalContent>
            </Modal>
          ));
        },
      },
    );
  }, [
    selectedExecutiveId,
    patchFundingChargedExecutive,
    selectedFundingIds,
    queryClient,
    id,
    close,
  ]);

  const handleClose = useCallback(() => {
    setSelectedExecutiveId(null);
    close();
  }, [close]);

  return (
    <Modal isOpen={isOpen}>
      <CancellableModalContent
        confirmButtonText="담당자 변경"
        confirmDisabled={selectedExecutiveId === null}
        onConfirm={handleSubmit}
        onClose={handleClose}
      >
        <AsyncBoundary isLoading={isLoading} isError={isError}>
          <FlexWrapper
            direction="column"
            gap={12}
            style={{ width: "min(600px, 80vw)" }}
          >
            <Select
              items={chargeableExecutives}
              value={selectedExecutiveId}
              onChange={setSelectedExecutiveId}
              label="개별 활동 보고서 담당자"
              isTextAlignStart
            />
            <ChargedChangeFundingModalTable
              selectedClubInfos={selectedFundingInfos}
              newExecutiveName={
                chargeableExecutives
                  .find(executive => executive.value === selectedExecutiveId)
                  ?.label.split(" ")[0] ?? ""
              }
            />
            <Typography
              fs={14}
              lh={20}
              fw="MEDIUM"
              style={{ textAlign: "left" }}
            >
              * 개별 활동 보고서 담당자를 변경할 경우, 해당 동아리의 활동 보고서
              담당자와 개별 활동 보고서 담당자가 달라질 수 있습니다.
            </Typography>
          </FlexWrapper>
        </AsyncBoundary>
      </CancellableModalContent>
    </Modal>
  );
};

export default ChargedChangeFundingModalContent;
