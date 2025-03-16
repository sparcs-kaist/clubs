import isPropValid from "@emotion/is-prop-valid";
import { flexRender, type Table as TableType } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import styled from "styled-components";

import TableCell from "./Table/TableCell";
import Typography from "./Typography";

interface TableProps<T> {
  table: TableType<T>;
  minWidth?: number;
  height?: number;
  emptyMessage?: string;
  count?: number;
  footer?: React.ReactNode;
  /* TODO: (@dora) refactor to use onClick only */
  rowLink?: (row: T) => string | { pathname: string };
  onClick?: (row: T) => void;
  unit?: string;
}
const TableInnerWrapper = styled.div`
  width: calc(100% + (100vw - 100%));
  padding: 0 calc((100vw - 100%) / 2);
  overflow-x: auto;
`;

const TableInner = styled.table.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ height?: number; minWidth: number }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: ${({ minWidth }) => `max(100%, ${minWidth}px)`};
  border: 1px solid ${({ theme }) => theme.colors.GRAY[300]};
  border-radius: 8px;
  overflow: hidden;
  border-spacing: 0;
  height: ${({ height }) => (height ? `${height}px` : "none")};
`;
const Header = styled.thead`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
`;
const HeaderRow = styled.tr`
  display: flex;
  width: 100%;
`;
const Content = styled.tbody`
  display: block;
  flex: 1;
  overflow-y: auto;
  width: 100%;
`;
const ContentRow = styled.tr.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ selected: boolean; isClickable: boolean }>`
  width: 100%;
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  cursor: ${({ isClickable }) => (isClickable ? "pointer" : "default")};
  background-color: ${({ selected, theme }) =>
    selected ? theme.colors.MINT[100] : "transparent"};
`;
const EmptyCenterPlacer = styled.div`
  height: 100%;
  display: flex;
  flex: 1;
  padding: 12px 8px 12px 8px;
  justify-content: center;
  align-items: center;
`;
const TableWithCount = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
`;
const Count = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  align-self: stretch;
`;
const Table = <T,>({
  table,
  minWidth = 900,
  height = undefined,
  emptyMessage = "내역이 없습니다",
  footer = null,
  count = undefined,
  rowLink = undefined,
  onClick = undefined,
  unit = "개",
}: TableProps<T>) => {
  // 야매로 min-width 바꿔치기 (고치지 마세요)
  // eslint-disable-next-line no-underscore-dangle
  table._getColumnDefs().forEach(column => {
    // eslint-disable-next-line no-param-reassign
    column.minSize = 0;
  });
  const router = useRouter();
  const handleRowClick = useCallback(
    (row: T) => {
      if (rowLink) {
        const link = rowLink(row);
        if (link) {
          if (typeof link === "string") {
            router.push(link);
          } else if (link?.pathname) {
            router.push(link.pathname);
          }
        }
      }
      if (onClick) {
        onClick(row);
      }
    },
    [rowLink, onClick, router],
  );

  return (
    <TableWithCount>
      <Count>
        {(count || count === 0) && (
          <Typography fs={16} lh={20}>
            총 {count}
            {unit}
          </Typography>
        )}
      </Count>
      <TableInnerWrapper>
        <TableInner height={height} minWidth={minWidth}>
          <Header>
            {table.getHeaderGroups().map(headerGroup => (
              <HeaderRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  if (header.isPlaceholder) {
                    return null;
                  }
                  if (header.column.getCanSort()) {
                    return (
                      <TableCell
                        key={header.id}
                        width={header.column.getSize()}
                        type="HeaderSort"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell
                      key={header.id}
                      width={header.column.getSize()}
                      type="Header"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </HeaderRow>
            ))}
          </Header>
          <Content>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <ContentRow
                  key={row.id}
                  selected={row.getIsSelected()}
                  isClickable={!!rowLink || !!onClick}
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      width={cell.column.getSize()}
                      type="Default"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </ContentRow>
              ))
            ) : (
              <EmptyCenterPlacer>
                <Typography
                  fs={16}
                  lh={24}
                  color="GRAY.300"
                  ff="PRETENDARD"
                  fw="REGULAR"
                >
                  {emptyMessage}
                </Typography>
              </EmptyCenterPlacer>
            )}
            {footer}
          </Content>
        </TableInner>
      </TableInnerWrapper>
    </TableWithCount>
  );
};
export default Table;
