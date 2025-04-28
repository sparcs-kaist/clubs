import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import apiAct023 from "@clubs/interface/api/activity/endpoint/apiAct023";
import apiAct024 from "@clubs/interface/api/activity/endpoint/apiAct024";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchSelect from "@sparcs-clubs/web/common/components/Forms/SearchSelect";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import ChargedChangeActivityModalTable, {
  ChargedChangeActivityProps,
} from "@sparcs-clubs/web/features/activity-report/components/executive/ChargedChangeActivityModalTable";
import { patchActivityChargedExecutive } from "@sparcs-clubs/web/features/activity-report/services/executive/patchActivityChargedExecutive";
import useGetActivityClubChargeAvailableExecutives from "@sparcs-clubs/web/features/activity-report/services/executive/useGetActivityClubChargeAvailableExecutives";

interface ChargedChangeActivityModalContentProps {
  isOpen: boolean;
  close: VoidFunction;
  selectedActivityIds: number[];
  selectedActivityInfos: ChargedChangeActivityProps[];
}

interface ChargeableExecutive {
  label: string;
  value: number;
}

const ChargedChangeActivityModalContent: React.FC<
  ChargedChangeActivityModalContentProps
> = ({ isOpen, close, selectedActivityIds, selectedActivityInfos }) => {
  const queryClient = useQueryClient();
  const { id } = useParams();

  const { data, isLoading, isError } =
    useGetActivityClubChargeAvailableExecutives({
      clubIds: [Number(id)],
    });
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

  return (
    <Modal isOpen={isOpen}>
      <CancellableModalContent
        onConfirm={async () => {
          if (selectedExecutiveId !== null) {
            await patchActivityChargedExecutive({
              activityIds: selectedActivityIds,
              executiveId: selectedExecutiveId,
            });
            await queryClient.invalidateQueries({
              queryKey: [apiAct024.url()],
            });
            queryClient.invalidateQueries({
              queryKey: [apiAct023.url()],
            });
            close();
          }
          setSelectedExecutiveId(null);
        }}
        onClose={() => {
          setSelectedExecutiveId(null);
          close();
        }}
      >
        <AsyncBoundary isLoading={isLoading} isError={isError}>
          <FlexWrapper
            direction="column"
            gap={12}
            style={{ width: "min(600px, 80vw)" }}
          >
            <SearchSelect
              items={chargeableExecutives}
              value={selectedExecutiveId}
              onChange={setSelectedExecutiveId}
              label="개별 활동 보고서 담당자"
            />
            <ChargedChangeActivityModalTable
              data={selectedActivityInfos}
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

export default ChargedChangeActivityModalContent;
