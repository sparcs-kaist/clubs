import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import styled from "styled-components";

import apiClb006, {
  type ApiClb006ResponseOK,
} from "@clubs/interface/api/club/endpoint/apiClb006";
import apiClb008, {
  type ApiClb008ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb008";
import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormError from "@sparcs-clubs/web/common/components/FormError";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { deleteChangeDelegateRequest } from "../services/deleteChangeDelegateRequest";
import { useGetChangeDelegateRequests } from "../services/getChangeDelegateRequests";
import { updateClubDelegates } from "../services/updateClubDelegate";
import ChangeRepresentativeInfo from "./ChangeRepresentativeInfo";
import {
  delegateRoleLabels,
  getDelegateCandidateItems,
} from "./delegateCandidates";

const LabelWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin: 0 2px;
  justify-content: space-between;
`;

const roles = [
  { id: ClubDelegateEnum.Representative, label: "대표자" },
  { id: ClubDelegateEnum.Delegate1, label: "대의원 1" },
  { id: ClubDelegateEnum.Delegate2, label: "대의원 2" },
];

type DelegateAction =
  | { type: "update"; delegateEnumId: ClubDelegateEnum; studentId: number }
  | { type: "cancel"; delegateEnumId: ClubDelegateEnum; requestId: number };

const ChangeRepresentativeCard: React.FC<{
  clubId: number;
  delegatesNow: ApiClb006ResponseOK;
  clubMembers: ApiClb008ResponseOk;
  clubName: string;
}> = ({ clubId, delegatesNow, clubMembers, clubName }) => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetChangeDelegateRequests({
    clubId,
  });

  const action = useMutation({
    mutationFn: (input: DelegateAction) =>
      input.type === "cancel"
        ? deleteChangeDelegateRequest(
            { clubId },
            { requestId: input.requestId },
          )
        : updateClubDelegates(
            { clubId },
            {
              delegateEnumId: input.delegateEnumId,
              studentId: input.studentId,
            },
          ),
    onSettled: async () => {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: [apiClb006.url(clubId)] }),
        queryClient.invalidateQueries({
          queryKey: [apiClb008.url(clubId, ClubDelegateEnum.Representative)],
        }),
      ]);
    },
  });

  const requests = data?.requests ?? [];
  const pendingRequests = requests.filter(
    request =>
      request.clubDelegateChangeRequestStatusEnumId ===
      ClubDelegateChangeRequestStatusEnum.Applied,
  );
  const pendingStudentIds = new Set(
    pendingRequests.map(request => request.studentId),
  );
  const disabled = isLoading || isError || action.isPending;

  return (
    <Card outline gap={32} style={{ flex: 1 }}>
      <Typography fw="MEDIUM" fs={20} lh={24}>
        대표자 및 대의원
      </Typography>
      {(isError || action.isError) && (
        <div role="alert">
          <FormError>
            {isError
              ? "변경 요청을 불러오지 못했습니다. 다시 시도해 주세요."
              : "변경을 처리하지 못했습니다. 현재 직책과 요청 상태를 확인해 주세요."}
          </FormError>
        </div>
      )}
      {roles.map(({ id, label }) => {
        const items = getDelegateCandidateItems(
          clubMembers.students,
          clubId,
          id,
          pendingStudentIds,
        );
        const current = delegatesNow.delegates.find(
          delegate => delegate.delegateEnumId === id,
        );
        const latestRequest = requests
          .filter(request => request.delegateEnumId === id)
          .sort((a, b) => b.id - a.id)[0];
        const pending = pendingRequests.find(
          request => request.delegateEnumId === id,
        );
        const rejected =
          latestRequest?.clubDelegateChangeRequestStatusEnumId ===
          ClubDelegateChangeRequestStatusEnum.Rejected
            ? latestRequest
            : undefined;
        const request = pending ?? rejected;
        const currentValue = current ? String(current.studentId) : "";
        const roleItems =
          current && !items.some(item => item.value === currentValue)
            ? [
                ...items,
                {
                  label: `${current.studentNumber} ${current.name} (${clubName} ${delegateRoleLabels[id]})`,
                  value: currentValue,
                  selectable: false,
                },
              ]
            : items;
        return (
          <FlexWrapper key={id} direction="column" gap={8}>
            <LabelWrapper>
              <Typography fw="MEDIUM" fs={16} lh={20}>
                {label}
              </Typography>
              {pending ? (
                <TextButton
                  text={`${label} 변경 요청 취소`}
                  disabled={disabled}
                  onClick={() =>
                    action.mutate({
                      type: "cancel",
                      delegateEnumId: id,
                      requestId: pending.id,
                    })
                  }
                />
              ) : (
                id !== ClubDelegateEnum.Representative &&
                current && (
                  <TextButton
                    text={`${label} 삭제`}
                    disabled={disabled}
                    onClick={() =>
                      action.mutate({
                        type: "update",
                        delegateEnumId: id,
                        studentId: 0,
                      })
                    }
                  />
                )
              )}
            </LabelWrapper>
            <Select
              items={roleItems}
              value={currentValue}
              placeholder="미지정"
              isRequired={id === ClubDelegateEnum.Representative}
              disabled={disabled || pending !== undefined}
              onChange={value =>
                action.mutate({
                  type: "update",
                  delegateEnumId: id,
                  studentId: Number(value),
                })
              }
            />
            {request && (
              <ChangeRepresentativeInfo
                type={pending ? "Applied" : "Rejected"}
                clubName={clubName}
                role={label}
                candidate={`${request.studentNumber} ${request.studentName}`}
              />
            )}
          </FlexWrapper>
        );
      })}
    </Card>
  );
};

export default ChangeRepresentativeCard;
