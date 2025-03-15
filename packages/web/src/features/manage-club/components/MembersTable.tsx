import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { overlay } from "overlay-kit";
import React from "react";
import styled from "styled-components";

import { ApiClb006ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb006";
import { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Table from "@sparcs-clubs/web/common/components/Table";
import TableButton from "@sparcs-clubs/web/common/components/Table/TableButton";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { MemTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import { usePatchClubMemberRegistration } from "../members/services/usePatchClubMemberRegistration";

type MemberRegistrationType = ApiReg008ResponseOk["applies"][number];

interface MembersTableProps {
  memberList: ApiReg008ResponseOk["applies"];
  clubName: string;
  clubId: number;
  refetch: () => void;
  delegates: ApiClb006ResponseOK["delegates"];
}

const RemarkColumnItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
`;

const openDelegateCannotBeRejectedModal = (refetch: () => void) => {
  overlay.open(({ isOpen, close }) => (
    <Modal isOpen={isOpen}>
      <ConfirmModalContent
        confirmButtonText="확인"
        onConfirm={async () => {
          close();
          refetch();
        }}
      >
        동아리 대표자/대의원의 동아리 신청은 반려할 수 없습니다.
        <br /> 해당 대표자/대의원 변경 후 반려 가능합니다.
      </ConfirmModalContent>
    </Modal>
  ));
};

const openStatusChangeModal = (
  targetStatus: RegistrationApplicationStudentStatusEnum,
  member: MemberRegistrationType,
  clubName: string,
  clubId: number,
  year: number,
  semesterName: string,
  refetch: () => void,
) => {
  const actionText =
    targetStatus === RegistrationApplicationStudentStatusEnum.Approved
      ? "승인"
      : "반려";
  overlay.open(({ isOpen, close }) => (
    <Modal isOpen={isOpen}>
      <CancellableModalContent
        confirmButtonText={actionText}
        onConfirm={async () => {
          await usePatchClubMemberRegistration(
            { applyId: member.id },
            {
              clubId,
              applyStatusEnumId: targetStatus,
            },
          );
          close();
          refetch();
        }}
        onClose={close}
      >
        {member.student.studentNumber} {member.student.name} 학생의 {year}년도{" "}
        {semesterName}학기 {clubName} 동아리 신청을
        <br /> {actionText}하시겠습니까?
      </CancellableModalContent>
    </Modal>
  ));
};

const columnHelper = createColumnHelper<MemberRegistrationType>();

const columnsFunction = (
  clubName: string,
  clubId: number,
  year: number,
  semesterName: string,
  refetch: () => void,
  delegates: ApiClb006ResponseOK["delegates"],
) => [
  columnHelper.accessor("applyStatusEnumId", {
    header: "상태",
    cell: info => {
      const { color, text } = getTagDetail(info.getValue(), MemTagList);
      return <Tag color={color}>{text}</Tag>;
    },
    size: 5,
  }),
  columnHelper.accessor("createdAt", {
    header: "신청 일시",
    cell: info => formatDateTime(info.getValue()),
    size: 30,
  }),
  columnHelper.accessor("student.studentNumber", {
    header: "학번",
    cell: info => info.getValue(),
    size: 5,
  }),
  columnHelper.accessor("student.name", {
    header: "신청자",
    cell: info => info.getValue(),
    size: 5,
  }),
  columnHelper.accessor("student.phoneNumber", {
    header: "전화번호",
    cell: info => info.getValue(),
    size: 20,
  }),
  columnHelper.accessor("student.email", {
    header: "이메일",
    cell: info => info.getValue(),
    size: 20,
  }),
  columnHelper.display({
    id: "remarks",
    header: "비고",
    cell: info => {
      const member = info.row.original;
      return (
        (member.applyStatusEnumId ===
          RegistrationApplicationStudentStatusEnum.Pending && (
          <TableButton
            text={["승인", "반려"]}
            onClick={[
              () =>
                openStatusChangeModal(
                  RegistrationApplicationStudentStatusEnum.Approved,
                  member,
                  clubName,
                  clubId,
                  year,
                  semesterName,
                  refetch,
                ),
              () =>
                delegates.some(
                  delegate =>
                    delegate.studentNumber === member.student.studentNumber,
                )
                  ? openDelegateCannotBeRejectedModal(refetch)
                  : openStatusChangeModal(
                      RegistrationApplicationStudentStatusEnum.Rejected,
                      member,
                      clubName,
                      clubId,
                      year,
                      semesterName,
                      refetch,
                    ),
            ]}
          />
        )) ||
        (member.applyStatusEnumId ===
          RegistrationApplicationStudentStatusEnum.Approved && (
          <RemarkColumnItem>
            <Typography
              fs={16}
              lh={20}
              style={{
                flex: 1,
                textAlign: "center",
                fontStyle: "normal",
                color: "var(--gray300, #DDD)",
                textDecorationLine: "underline",
                textDecorationStyle: "solid",
                textDecorationSkipInk: "none",
                textDecorationThickness: "auto",
                textUnderlineOffset: "auto",
                textUnderlinePosition: "from-font",
              }}
            >
              승인
            </Typography>
            <Typography
              fs={16}
              lh={20}
              style={{
                flex: 1,
                textAlign: "center",
                fontStyle: "normal",
                color: "var(--gray300, #DDD)",
              }}
            >
              /
            </Typography>
            <TableButton
              text={["반려"]}
              onClick={[
                () =>
                  delegates.some(
                    delegate =>
                      delegate.studentNumber === member.student.studentNumber,
                  )
                    ? openDelegateCannotBeRejectedModal(refetch)
                    : openStatusChangeModal(
                        RegistrationApplicationStudentStatusEnum.Rejected,
                        member,
                        clubName,
                        clubId,
                        year,
                        semesterName,
                        refetch,
                      ),
              ]}
            />
          </RemarkColumnItem>
        )) ||
        (member.applyStatusEnumId ===
          RegistrationApplicationStudentStatusEnum.Rejected && (
          <RemarkColumnItem>
            <TableButton
              text={["승인"]}
              onClick={[
                () =>
                  openStatusChangeModal(
                    RegistrationApplicationStudentStatusEnum.Approved,
                    member,
                    clubName,
                    clubId,
                    year,
                    semesterName,
                    refetch,
                  ),
              ]}
            />
            <Typography
              fs={16}
              lh={20}
              style={{
                flex: 1,
                textAlign: "center",
                fontStyle: "normal",
                color: "var(--gray300, #DDD)",
              }}
            >
              /
            </Typography>
            <Typography
              fs={16}
              lh={20}
              style={{
                flex: 1,
                textAlign: "center",
                fontStyle: "normal",
                color: "var(--gray300, #DDD)",
                textDecorationLine: "underline",
                textDecorationStyle: "solid",
                textDecorationSkipInk: "none",
                textDecorationThickness: "auto",
                textUnderlineOffset: "auto",
                textUnderlinePosition: "from-font",
              }}
            >
              반려
            </Typography>
          </RemarkColumnItem>
        ))
      );
    },
    size: 15,
  }),
];

const MembersTable: React.FC<MembersTableProps> = ({
  memberList,
  clubName,
  clubId,
  refetch,
  delegates,
}) => {
  const { semester: semesterInfo } = useGetSemesterNow();

  const columns = columnsFunction(
    clubName,
    clubId,
    semesterInfo?.year ?? 0,
    semesterInfo?.name ?? "",
    refetch,
    delegates,
  );
  const table = useReactTable({
    columns,
    data: memberList,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return <Table table={table} count={memberList.length} unit="명" />;
};

export default MembersTable;
