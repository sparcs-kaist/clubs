"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { overlay } from "overlay-kit";
import { useMemo, useState } from "react";
import styled from "styled-components";

import { ApiClb020ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb020";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Checkbox from "@sparcs-clubs/web/common/components/Checkbox";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Select from "@sparcs-clubs/web/common/components/Select";
import Table from "@sparcs-clubs/web/common/components/Table";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";

import {
  useChangeRegistrationDelegate,
  useGetRegistrationDelegateChangeDetail,
} from "../services/useRegistrationDelegateChange";

type Delegate = ApiClb020ResponseOk["delegates"][number];
type Member = ApiClb020ResponseOk["members"][number];
type MemberRow = Member & {
  clubId: number;
  effectiveAt: Date;
  isChangeable: boolean;
};
const delegateColumnHelper = createColumnHelper<Delegate>();
const memberColumnHelper = createColumnHelper<MemberRow>();
const roleLabels: Record<ClubDelegateEnum, string> = {
  [ClubDelegateEnum.Representative]: "대표자",
  [ClubDelegateEnum.Delegate1]: "대의원 1",
  [ClubDelegateEnum.Delegate2]: "대의원 2",
};
const roleItems = Object.entries(roleLabels).map(([value, label]) => ({
  value: Number(value) as ClubDelegateEnum,
  label,
}));

const ConfirmationLabel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
  cursor: pointer;
`;

interface ChangeModalProps {
  member: Member;
  effectiveAt: Date;
  onClose: () => void;
  onConfirm: (role: ClubDelegateEnum) => void;
}

const ChangeModal = ({
  member,
  effectiveAt,
  onClose,
  onConfirm,
}: ChangeModalProps) => {
  const [role, setRole] = useState(ClubDelegateEnum.Representative);
  const [confirmed, setConfirmed] = useState(false);
  const effectiveDate = effectiveAt.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  return (
    <CancellableModalContent
      onClose={onClose}
      onConfirm={() => onConfirm(role)}
      confirmDisabled={!confirmed}
      confirmButtonText="직책 변경"
    >
      <FlexWrapper direction="column" gap={16}>
        <Typography fs={18} lh={24} fw="SEMIBOLD">
          {member.name} ({member.studentNumber})
        </Typography>
        <Select
          items={roleItems}
          value={role}
          onChange={setRole}
          label="변경할 직책"
          isTextAlignStart
        />
        <ConfirmationLabel onClick={() => setConfirmed(value => !value)}>
          <Checkbox checked={confirmed} />
          <Typography fs={15} lh={22}>
            {member.name} 학생을 {roleLabels[role]}로 지정하며, {effectiveDate}
            에 변경된 것으로 기록되는 것을 확인했습니다.
          </Typography>
        </ConfirmationLabel>
      </FlexWrapper>
    </CancellableModalContent>
  );
};

const openSuccessModal = () => {
  overlay.open(({ isOpen, close }) => (
    <Modal isOpen={isOpen} onClose={close}>
      <ConfirmModalContent onConfirm={close}>
        대표자·대의원 변경을 완료했습니다.
      </ConfirmModalContent>
    </Modal>
  ));
};

const MemberActionCell = ({ member }: { member: MemberRow }) => {
  const { mutate: changeDelegate, isPending } = useChangeRegistrationDelegate(
    member.clubId,
  );

  if (!member.isRegularMember) return <>-</>;

  const openChangeModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen} onClose={close}>
        <ChangeModal
          member={member}
          effectiveAt={member.effectiveAt}
          onClose={close}
          onConfirm={role => {
            close();
            changeDelegate(
              { studentId: member.studentId, clubDelegateEnumId: role },
              { onSuccess: openSuccessModal },
            );
          }}
        />
      </Modal>
    ));
  };

  return (
    <Button
      type={
        member.isChangeable && member.isAssignable && !isPending
          ? "default"
          : "disabled"
      }
      title={
        member.isAssignable
          ? undefined
          : "사용자 계정이 없거나 다른 동아리의 대표자·대의원입니다."
      }
      onClick={openChangeModal}
    >
      직책 변경
    </Button>
  );
};

const delegateColumns = [
  delegateColumnHelper.accessor("clubDelegateEnumId", {
    header: "직책",
    cell: info => roleLabels[info.getValue()],
    size: 160,
  }),
  delegateColumnHelper.accessor("studentNumber", {
    header: "학번",
    size: 180,
  }),
  delegateColumnHelper.accessor("name", { header: "이름", size: 180 }),
];
const memberColumns = [
  memberColumnHelper.accessor("studentNumber", {
    header: "학번",
    size: 180,
  }),
  memberColumnHelper.accessor("name", { header: "이름", size: 180 }),
  memberColumnHelper.accessor("isRegularMember", {
    header: "회원 구분",
    cell: info => (info.getValue() ? "정회원" : "준회원"),
    size: 140,
  }),
  memberColumnHelper.display({
    id: "actions",
    header: "관리",
    cell: ({ row }) => <MemberActionCell member={row.original} />,
    size: 180,
  }),
];

const RegistrationDelegateChangeDetailFrame = ({
  clubId,
}: {
  clubId: number;
}) => {
  const { data, isLoading, isError } =
    useGetRegistrationDelegateChangeDetail(clubId);
  const memberRows = useMemo(
    () =>
      (data?.members ?? []).map(member => ({
        ...member,
        clubId,
        effectiveAt: data?.effectiveAt ?? new Date(0),
        isChangeable: data?.isChangeable ?? false,
      })),
    [clubId, data],
  );
  const delegateTable = useReactTable({
    data: data?.delegates ?? [],
    columns: delegateColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  const memberTable = useReactTable({
    data: memberRows,
    columns: memberColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <Banner icon="warning">
        {data?.isChangeable
          ? "동아리 등록 기간에만 변경할 수 있습니다. 등록 서류를 제출하면 더 이상 변경할 수 없습니다."
          : "현재 동아리 등록 기간이 아니므로 대표자·대의원을 변경할 수 없습니다."}
      </Banner>
      <Typography fs={20} lh={28} fw="SEMIBOLD">
        {data?.club.nameKr} ({data?.club.nameEn}) · {data?.club.divisionName}
      </Typography>
      <SectionTitle>대표자·대의원 명단</SectionTitle>
      <Table
        table={delegateTable}
        count={data?.delegates.length ?? 0}
        minWidth={520}
        emptyMessage="대표자·대의원 정보가 없습니다."
      />
      <SectionTitle>전 학기 활동회원 명단</SectionTitle>
      <Table
        table={memberTable}
        count={data?.members.length ?? 0}
        minWidth={680}
        emptyMessage="전 학기 활동회원이 없습니다."
      />
    </AsyncBoundary>
  );
};

export default RegistrationDelegateChangeDetailFrame;
