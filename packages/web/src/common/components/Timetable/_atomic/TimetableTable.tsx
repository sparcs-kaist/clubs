import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TimetableCell, { TimetableCellType } from "./TimetableCell";

interface TimetableTableProps {
  rows: number;
  columns: number;
  data: TimetableCellType[];
  setIndexRange: React.Dispatch<React.SetStateAction<number[]>>;
}

const TimetableTableInner = styled.div<{
  rows: number;
  columns: number;
}>`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: repeat(${({ columns }) => columns}, 1fr);
  grid-template-rows: repeat(${({ rows }) => rows}, 24px);
  width: 100%;
  height: auto;
  height: 1000px !important;
`;

const TimetableTable: React.FC<TimetableTableProps> = ({
  rows,
  columns,
  data,
  setIndexRange,
}) => {
  const [start, setStart] = useState<number>();
  const [end, setEnd] = useState<number>();
  const [hover, setHover] = useState<number>();
  const [selecting, setSelecting] = useState<boolean>(false);

  const [selectedData, setSelectedData] = useState<TimetableCellType[]>(data);

  const checkValidCell = (id: number) =>
    data[id] !== "disabled" && data[id] !== "past";

  const checkSameColumn = (first: number, second: number) =>
    Math.floor(first / rows) === Math.floor(second / rows);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const { id } = (e.target as HTMLDivElement).dataset;
    if (id && checkValidCell(parseInt(id))) {
      setStart(parseInt(id));
      setEnd(undefined);
      setSelecting(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const { id } = (e.target as HTMLDivElement).dataset;
    if (id && checkValidCell(parseInt(id)) && selecting) {
      setEnd(parseInt(id));
      setSelecting(false);
    }
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    const { id } = (e.target as HTMLDivElement).dataset;
    if (id && selecting && start) {
      if (
        checkValidCell(parseInt(id)) &&
        checkSameColumn(start, parseInt(id))
      ) {
        setEnd(parseInt(id));
      } else {
        setSelecting(false);
      }
    }
    if (id && !selecting) {
      setHover(parseInt(id));
    }
  };

  useEffect(() => {
    const newSelectedData = data.map((type, index) => {
      if (type === "default" && index === hover) {
        return "hover";
      }
      return type;
    });
    setSelectedData(newSelectedData);
  }, [hover]);

  useEffect(() => {
    if (start !== undefined && end !== undefined) {
      const [min, max] = [Math.min(start, end), Math.max(start, end)];
      setSelectedData(
        data.map((type, index) => {
          let retType = type;
          if (index >= min && index <= max) {
            retType = "selected";
          } else if (type === "default" && index === hover) {
            retType = "hover";
          }
          return retType;
        }),
      );
      setIndexRange([min, max]);
    } else {
      setSelectedData(
        data.map((type, index) => {
          if (type === "default" && index === hover) {
            return "hover";
          }
          return type;
        }),
      );
    }
  }, [start, end, hover]);

  return (
    <TimetableTableInner
      columns={columns}
      rows={rows}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseOver={handleMouseOver}
      onMouseLeave={() => setHover(undefined)}
    >
      {selectedData.map((type, index) => (
        <TimetableCell
          data-id={index}
          key={index.toString() + type}
          type={type}
        />
      ))}
    </TimetableTableInner>
  );
};

export default TimetableTable;
