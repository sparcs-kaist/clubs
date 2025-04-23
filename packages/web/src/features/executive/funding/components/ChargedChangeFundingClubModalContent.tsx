import { useQueryClient } from "@tanstack/react-query";
import { overlay } from "overlay-kit";
import { useCallback, useEffect, useState } from "react";

import apiFnd008 from "@clubs/interface/api/funding/endpoint/apiFnd008";
import { ApiFnd016ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd016";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import useGetFundingClubChargeAvailableExecutives from "../services/useGetFundingClubChargeAvailableExecutives";
import usePatchFundingChargedExecutive from "../services/usePatchFundingChargedExecutive";
import ChargedChangeFundingModalTable, {
  ChargedChangeFundingProps,
} from "./ChargedChangeFundingModalTable";

interface ChargedChangeFundingModalContentProps {
  isOpen: boolean;
  close: () => void;
  selectedClubIds: number[];
  selectedClubInfos: ChargedChangeFundingProps[];
}

interface ChargeableExecutive {
  label: string;
  value: number;
}

const ChargedChangeFundingClubModalContent = ({
  isOpen,
  close,
  selectedClubIds,
  selectedClubInfos,
}: ChargedChangeFundingModalContentProps) => {
  const queryClient = useQueryClient();
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<number | null>(
    null,
  );
  const [chargeableExecutives, setChargeableExecutives] = useState<
    ChargeableExecutive[]
  >([]);

  const { data, isLoading, isError } =
    useGetFundingClubChargeAvailableExecutives({
      clubIds: selectedClubIds,
    });
  const { mutate } = usePatchFundingChargedExecutive();

  useEffect(() => {
    if (data) {
      setChargeableExecutives(
        data.executives
          .map((executive: ApiFnd016ResponseOk["executives"][number]) => ({
            label: `${executive.name} (${executive.studentNumber})`,
            value: executive.id,
          }))
          .sort((a: ChargeableExecutive, b: ChargeableExecutive) =>
            a.label.localeCompare(b.label),
          ),
      );
    }
  }, [data]);

  const handleSubmit = useCallback(() => {
    if (selectedExecutiveId === null) return;
    mutate(
      {
        body: {
          clubIds: selectedClubIds,
          executiveId: selectedExecutiveId,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [apiFnd008.url()],
          });
          close();
          setSelectedExecutiveId(null);
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
  }, [selectedClubIds, selectedExecutiveId, queryClient, close, mutate]);

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
              label="동아리별 지원금 담당자"
              isTextAlignStart
            />
            <ChargedChangeFundingModalTable
              selectedClubInfos={selectedClubInfos}
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
              * 동아리별 지원금 담당자를 변경할 경우, 해당 동아리가 작성한
              지원금의 담당자가 모두 해당 담당자로 변경됩니다.
            </Typography>
          </FlexWrapper>
        </AsyncBoundary>
      </CancellableModalContent>
    </Modal>
  );
};

export default ChargedChangeFundingClubModalContent;
