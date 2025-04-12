import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { ApiClb006ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb006";
import { ApiClb008ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb008";
import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Select, { SelectItem } from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { deleteChangeDelegateRequest } from "../services/deleteChangeDelegateRequest";
import { useGetChangeDelegateRequests } from "../services/getChangeDelegateRequests";
import { updateClubDelegates } from "../services/updateClubDelegate";
import ChangeRepresentativeInfo from "./ChangeRepresentativeInfo";

const LabelWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin: 0 2px;
  justify-content: space-between;
`;

const ChangeRepresentativeCard: React.FC<{
  clubId: number;
  delegatesNow: ApiClb006ResponseOK;
  clubMembers: ApiClb008ResponseOk;
  clubName: string;
}> = ({ clubId, delegatesNow, clubMembers, clubName }) => {
  const getSelectItems = (members: ApiClb008ResponseOk): SelectItem<string>[] =>
    members?.students.map(member => ({
      label: `${member.studentNumber} ${member.name}${
        member.phoneNumber ? ` (${member.phoneNumber})` : ""
      }`,
      value: member.id.toString(),
      selectable: !delegatesNow.delegates.some(
        delegate => delegate.studentId === member.id,
      ),
    })) ?? [];

  const [representativeItems, setRepresentativeItems] = useState<
    SelectItem<string>[]
  >(getSelectItems(clubMembers));

  const [delegateItems, setDelegateItems] = useState<SelectItem<string>[]>(
    getSelectItems(clubMembers).filter(
      item =>
        item.value !==
        delegatesNow?.delegates
          .find(
            delegate =>
              delegate.delegateEnumId === ClubDelegateEnum.Representative,
          )
          ?.studentId?.toString(),
    ),
  );

  const representative =
    delegatesNow?.delegates
      .find(
        delegate => delegate.delegateEnumId === ClubDelegateEnum.Representative,
      )
      ?.studentId?.toString() ?? "";

  const representativeName =
    delegatesNow?.delegates.find(
      delegate => delegate.delegateEnumId === ClubDelegateEnum.Representative,
    )?.name ?? "";

  const representativeStudentNumber =
    delegatesNow?.delegates.find(
      delegate => delegate.delegateEnumId === ClubDelegateEnum.Representative,
    )?.studentNumber ?? "";

  const [delegate1, setDelegate1] = useState<string>(
    delegatesNow?.delegates.find(
      delegate => delegate.delegateEnumId === ClubDelegateEnum.Delegate1,
    )?.studentId === 0
      ? ""
      : (delegatesNow?.delegates
          .find(
            delegate => delegate.delegateEnumId === ClubDelegateEnum.Delegate1,
          )
          ?.studentId.toString() ?? ""),
  );
  const [delegate2, setDelegate2] = useState<string>(
    delegatesNow?.delegates.find(
      delegate => delegate.delegateEnumId === ClubDelegateEnum.Delegate2,
    )?.studentId === 0
      ? ""
      : (delegatesNow?.delegates
          .find(
            delegate => delegate.delegateEnumId === ClubDelegateEnum.Delegate2,
          )
          ?.studentId.toString() ?? ""),
  );

  const [type, setType] = useState<
    "Default" | "Applied" | "Rejected" | "Canceled"
  >("Default");

  const { data: requestStatus, refetch } = useGetChangeDelegateRequests({
    clubId,
  });

  useEffect(() => {
    switch (requestStatus?.requests[0]?.clubDelegateChangeRequestStatusEnumId) {
      case ClubDelegateChangeRequestStatusEnum.Applied:
        setType("Applied");
        break;
      case ClubDelegateChangeRequestStatusEnum.Approved:
        setType("Default");
        break;
      case ClubDelegateChangeRequestStatusEnum.Rejected:
        setType("Rejected");
        break;
      default:
        setType("Default");
    }
  }, [requestStatus]);

  const updateCandidateItems = () => {
    setRepresentativeItems(prevItems =>
      prevItems.map(item =>
        item.value === delegate1 ||
        item.value === delegate2 ||
        item.value === representative
          ? { ...item, selectable: false }
          : { ...item, selectable: true },
      ),
    );
    setDelegateItems(prevItems =>
      prevItems.map(item =>
        item.value === delegate1 ||
        item.value === delegate2 ||
        item.value === representative
          ? { ...item, selectable: false }
          : { ...item, selectable: true },
      ),
    );
  };

  useEffect(() => {
    if (
      delegate1 !==
        delegatesNow?.delegates
          .find(
            delegate => delegate.delegateEnumId === ClubDelegateEnum.Delegate1,
          )
          ?.studentId?.toString() &&
      type !== "Applied" &&
      delegate1 !== ""
    ) {
      updateClubDelegates(
        { clubId },
        {
          delegateEnumId: ClubDelegateEnum.Delegate1,
          studentId: delegate1 === "" ? 0 : Number(delegate1),
        },
      );
      updateCandidateItems();
    }
  }, [delegate1, delegatesNow]);

  useEffect(() => {
    if (
      delegate2 !==
        delegatesNow?.delegates
          .find(
            delegate => delegate.delegateEnumId === ClubDelegateEnum.Delegate2,
          )
          ?.studentId?.toString() &&
      type !== "Applied" &&
      delegate2 !== ""
    ) {
      updateClubDelegates(
        { clubId },
        {
          delegateEnumId: ClubDelegateEnum.Delegate2,
          studentId: delegate2 === "" ? 0 : Number(delegate2),
        },
      );
      updateCandidateItems();
    }
  }, [delegate2, delegatesNow]);

  const cancelRequest = () => {
    setType("Canceled");
    deleteChangeDelegateRequest({ clubId });
  };

  const changeDelegateRequest = async (
    studentId: number,
    delegateEnumId: ClubDelegateEnum,
  ) => {
    await updateClubDelegates({ clubId }, { delegateEnumId, studentId });
    await refetch();
    if (delegateEnumId === ClubDelegateEnum.Representative && studentId !== 0) {
      setType("Applied");
    }
    updateCandidateItems();
  };

  return (
    <Card outline gap={32} style={{ flex: 1 }}>
      <Typography fw="MEDIUM" fs={20} lh={24}>
        대표자 및 대의원
      </Typography>
      {type !== "Default" && (
        <ChangeRepresentativeInfo
          type={type}
          clubName={clubName}
          prevRepresentative={`${representativeStudentNumber} ${representativeName}`}
          newRepresentative={`${requestStatus?.requests[0]?.studentNumber} ${requestStatus?.requests[0]?.studentName}`}
        />
      )}
      <FlexWrapper direction="column" gap={4}>
        <LabelWrapper>
          <Typography fw="MEDIUM" fs={16} lh={20}>
            대표자
          </Typography>
          {type === "Applied" && (
            <TextButton text="대표자 변경 요청 취소" onClick={cancelRequest} />
          )}
        </LabelWrapper>
        <Select
          items={representativeItems}
          value={representative}
          onChange={value => {
            changeDelegateRequest(
              Number(value),
              ClubDelegateEnum.Representative,
            );
          }}
          disabled={type === "Applied"}
        />
      </FlexWrapper>
      <FlexWrapper direction="column" gap={4}>
        <LabelWrapper>
          <Typography fw="MEDIUM" fs={16} lh={20}>
            대의원 1
          </Typography>
          <TextButton
            text="대의원1 삭제"
            onClick={async () => {
              setDelegateItems(prevItems =>
                prevItems.map(item =>
                  item.value === delegate1
                    ? { ...item, selectable: true }
                    : item,
                ),
              );
              setRepresentativeItems(prevItems =>
                prevItems.map(item =>
                  item.value === delegate1
                    ? { ...item, selectable: true }
                    : item,
                ),
              );
              setDelegate1("");
              await updateClubDelegates(
                { clubId },
                { delegateEnumId: ClubDelegateEnum.Delegate1, studentId: 0 },
              );
            }}
            disabled={delegate1 === "" || type === "Applied"}
          />
        </LabelWrapper>
        <Select
          items={delegateItems}
          value={delegate1}
          onChange={setDelegate1}
          isRequired={false}
          disabled={type === "Applied"}
        />
      </FlexWrapper>
      <FlexWrapper direction="column" gap={4}>
        <LabelWrapper>
          <Typography fw="MEDIUM" fs={16} lh={20}>
            대의원 2
          </Typography>
          <TextButton
            text="대의원2 삭제"
            onClick={async () => {
              setDelegateItems(prevItems =>
                prevItems.map(item =>
                  item.value === delegate2
                    ? { ...item, selectable: true }
                    : item,
                ),
              );
              setRepresentativeItems(prevItems =>
                prevItems.map(item =>
                  item.value === delegate2
                    ? { ...item, selectable: true }
                    : item,
                ),
              );
              setDelegate2("");
              await updateClubDelegates(
                { clubId },
                { delegateEnumId: ClubDelegateEnum.Delegate2, studentId: 0 },
              );
            }}
            disabled={delegate2 === "" || type === "Applied"}
          />
        </LabelWrapper>
        <Select
          items={delegateItems}
          value={delegate2}
          onChange={setDelegate2}
          isRequired={false}
          disabled={type === "Applied"}
        />
      </FlexWrapper>
    </Card>
  );
};

export default ChangeRepresentativeCard;
