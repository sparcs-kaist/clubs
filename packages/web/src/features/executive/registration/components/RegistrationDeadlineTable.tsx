import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ko } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo } from "react";

import { ApiSem019ResponseOk } from "@clubs/interface/api/semester/apiSem019";
import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Table from "@sparcs-clubs/web/common/components/Table";
import TableActionButton from "@sparcs-clubs/web/common/components/Table/TableActionButton";

import useDeleteRegistrationDeadline from "../services/useDeleteRegistrationDeadline";

const registrationDeadlineEnumToString = (
  value: RegistrationDeadlineEnum,
): string => {
  switch (value) {
    case RegistrationDeadlineEnum.ClubRegistrationApplication:
      return "동아리 등록 신청";
    case RegistrationDeadlineEnum.ClubRegistrationLate:
      return "동아리 등록 지연 제출";
    case RegistrationDeadlineEnum.StudentRegistrationApplication:
      return "회원 등록 신청";
    case RegistrationDeadlineEnum.StudentRegistrationLate:
      return "회원 등록 지연 제출";
    default:
      return "";
  }
};

export { registrationDeadlineEnumToString };

interface RegistrationDeadlineTableProps {
  deadlines: ApiSem019ResponseOk["deadlines"];
}

const RegistrationDeadlineTable = ({
  deadlines,
}: RegistrationDeadlineTableProps) => {
  const {
    mutate: deleteRegistrationDeadline,
    isPending: isDeletingRegistrationDeadline,
  } = useDeleteRegistrationDeadline();

  const sortedDeadlines = useMemo(() => {
    if (!deadlines) return [];
    return [...deadlines].sort(
      (a, b) =>
        new Date(b.startTerm).getTime() - new Date(a.startTerm).getTime(),
    );
  }, [deadlines]);

  const handleDelete = (id: number) => {
    deleteRegistrationDeadline({ registrationDeadlineId: id });
  };

  const actionsCellRenderer = (id: number) => (
    <TableActionButton
      variant="delete"
      onClick={() => handleDelete(id)}
      disabled={isDeletingRegistrationDeadline}
    />
  );

  const columnHelper =
    createColumnHelper<ApiSem019ResponseOk["deadlines"][number]>();
  const columns = [
    columnHelper.accessor("deadlineEnum", {
      header: "구분",
      cell: info => registrationDeadlineEnumToString(info.getValue()),
      size: 160,
    }),
    columnHelper.accessor("startTerm", {
      header: "시작일",
      cell: info =>
        info.getValue()
          ? formatInTimeZone(
              info.getValue(),
              "Asia/Seoul",
              "yyyy-MM-dd (ccc)",
              { locale: ko },
            )
          : "-",
      size: 150,
      enableSorting: false,
    }),
    columnHelper.accessor("endTerm", {
      header: "종료일",
      cell: info =>
        info.getValue()
          ? formatInTimeZone(
              info.getValue(),
              "Asia/Seoul",
              "yyyy-MM-dd (ccc)",
              { locale: ko },
            )
          : "-",
      size: 150,
      enableSorting: false,
    }),
    columnHelper.display({
      id: "actions",
      header: "관리",
      cell: ({ row }) => actionsCellRenderer(row.original.id),
      size: 96,
    }),
  ];

  const table = useReactTable({
    data: sortedDeadlines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  });

  return (
    <FlexWrapper direction="column" gap={8}>
      <Table count={sortedDeadlines.length} table={table} />
    </FlexWrapper>
  );
};

export default RegistrationDeadlineTable;
