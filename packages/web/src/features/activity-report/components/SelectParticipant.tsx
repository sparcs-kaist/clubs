import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";

import Card from "@sparcs-clubs/web/common/components/Card";
import Checkbox from "@sparcs-clubs/web/common/components/Checkbox";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import Table from "@sparcs-clubs/web/common/components/Table";
import Toggle from "@sparcs-clubs/web/common/components/Toggle";
import Typography from "@sparcs-clubs/web/common/components/Typography";

interface SelectParticipantProps {
  data: IStudentSummary[];
  value?: IStudentSummary[];
  onChange?: (value: IStudentSummary[]) => void;
}

const SelectParticipantInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  align-self: stretch;
`;

const CheckboxCenterPlacer = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

const columnHelper = createColumnHelper<IStudentSummary>();

const columns = [
  columnHelper.display({
    id: "multiSelect",
    header: ({ table }) => (
      <CheckboxCenterPlacer>
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onClick={table.getToggleAllRowsSelectedHandler()}
        />
      </CheckboxCenterPlacer>
    ),
    cell: ({ row }) => (
      <CheckboxCenterPlacer>
        <Checkbox
          checked={row.getIsSelected()}
          onClick={row.getToggleSelectedHandler()}
        />
      </CheckboxCenterPlacer>
    ),
  }),
  columnHelper.accessor("studentNumber", {
    header: "학번",
    cell: info => info.getValue(),
    enableGlobalFilter: true,
  }),
  columnHelper.accessor("name", {
    header: "신청자",
    cell: info => info.getValue(),
    enableGlobalFilter: true,
  }),
];

// TODO: es hangul 검색 달기
const SelectParticipant: React.FC<SelectParticipantProps> = ({
  data,
  value = [],
  onChange = null,
}) => {
  const [searchText, setSearchText] = useState<string>("");

  const [selected, setSelected] = useState<IStudentSummary[]>(value);

  const initialRowValues = useMemo(
    () =>
      value.reduce((acc, participant) => {
        const index = data.findIndex(_data => _data.id === participant.id);
        return { ...acc, [index]: true };
      }, {}),
    [value, data],
  );
  const [rowValues, setRowValues] =
    useState<RowSelectionState>(initialRowValues);

  useEffect(() => {
    setRowValues(initialRowValues);
  }, [initialRowValues]);
  useEffect(() => {
    setSelected(data.filter((_, i) => rowValues?.[i]));
  }, [rowValues, data]);

  const handleRowClick = (rowState: RowSelectionState) => {
    setRowValues(rowState);

    const newSelected = data.filter((_, i) => rowState?.[i]);
    setSelected(newSelected);
    if (onChange) {
      onChange(newSelected);
    }
  };

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      rowSelection: rowValues,
      globalFilter: searchText,
    },
    onRowSelectionChange: updaterOrValue => {
      if (typeof updaterOrValue === "function") {
        handleRowClick(updaterOrValue(rowValues));
      } else {
        handleRowClick(updaterOrValue);
      }
    },
    initialState: {
      sorting: [
        {
          id: "studentNumber",
          desc: true,
        },
      ],
    },
    enableSorting: false,
  });

  return (
    <Card outline padding="32px" gap={32} style={{ overflow: "hidden" }}>
      <SearchInput
        searchText={searchText}
        handleChange={setSearchText}
        placeholder="학번 또는 이름을 검색해주세요"
      />
      <SelectParticipantInner>
        <Typography fs={16} fw="REGULAR" lh={20} color="GRAY.600">
          {searchText && `검색 결과 ${table.getRowModel().rows.length}명 / `}
          {`총 ${data.length}명`}
        </Typography>
        <Table
          table={table}
          height={320}
          emptyMessage="검색 결과가 존재하지 않습니다"
        />
      </SelectParticipantInner>
      <Toggle
        label={
          <Typography fs={16} lh={20} fw="MEDIUM">
            선택된 회원 목록 ({selected.length}명)
          </Typography>
        }
      >
        {selected.length ? (
          selected.map(participant => (
            <Typography key={participant.id} fs={16} lh={20} fw="REGULAR">
              {participant.studentNumber} {participant.name}
            </Typography>
          ))
        ) : (
          <Typography fs={16} fw="REGULAR" color="GRAY.300">
            선택된 회원이 없습니다.
          </Typography>
        )}
      </Toggle>
    </Card>
  );
};

export default SelectParticipant;
