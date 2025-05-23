import * as XLSX from "sheetjs-style";

import { ClubBuildingEnum } from "@clubs/domain/club/club-semester";

import { ApiOvv001ResponseOK } from "@clubs/interface/api/overview/endpoint/apiOvv001";
import { ApiOvv002ResponseOK } from "@clubs/interface/api/overview/endpoint/apiOvv002";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

interface ClubsOverviewData {
  delegates?: ApiOvv001ResponseOK;
  clubInfo?: ApiOvv002ResponseOK;
}

const commonCellStyle: XLSX.CellObject["s"] = {
  font: {
    name: "Arial",
    sz: "9",
  },
  alignment: {
    vertical: "center",
    horizontal: "center",
  },
};

function colWidth(width: number): XLSX.ColInfo {
  const MDW = 6;
  const wpx = Math.floor((width + Math.round(128 / MDW) / 256) * MDW);
  return {
    width,
    wpx,
    wch: Math.floor(((wpx - 5) / MDW) * 100 + 0.5) / 100,
  };
}

function fillColorOfSheet(sheet: XLSX.Sheet) {
  const fillColorSingleCell = (cell: string, rgb: string) => {
    if (sheet[cell]) {
      if (!sheet[cell].s) {
        // eslint-disable-next-line no-param-reassign
        sheet[cell].s = { fill: { fgColor: { rgb: `FF${rgb}` } } };
      } else {
        // eslint-disable-next-line no-param-reassign
        sheet[cell].s.fill = { fgColor: { rgb: `FF${rgb}` } };
      }
    }
  };

  return (cell: string, rgb: string) => {
    const range = cell.split(":");
    if (range.length === 1) {
      fillColorSingleCell(range[0], rgb);
    } else if (range.length === 2) {
      const [start, end] = range;
      const startCol = start.charCodeAt(0);
      const endCol = end.charCodeAt(0);
      const startRow = Number.parseInt(start.substring(1));
      const endRow = Number.parseInt(end.substring(1));

      for (let col = startCol; col <= endCol; col += 1) {
        for (let row = startRow; row <= endRow; row += 1) {
          fillColorSingleCell(`${String.fromCharCode(col)}${row}`, rgb);
        }
      }
    }
  };
}

function createDelegateOverviewSheet(data: ApiOvv001ResponseOK) {
  const regulars = data.filter(
    club => club.clubTypeEnum === ClubTypeEnum.Regular,
  );
  const provisionals = data.filter(
    club => club.clubTypeEnum === ClubTypeEnum.Provisional,
  );

  const rowMap = (row: ApiOvv001ResponseOK[number]) => [
    row.district,
    row.divisionName,
    row.clubNameKr,
    row.representative?.name,
    row.representative?.studentNumber,
    row.representative?.department,
    row.representative?.phoneNumber,
    row.representative?.kaistEmail,
    row.delegate1?.name,
    row.delegate1?.studentNumber,
    row.delegate1?.department,
    row.delegate2?.name,
    row.delegate2?.studentNumber,
    row.delegate2?.department,
  ];

  let aoa = regulars.map(rowMap);
  aoa.unshift(
    [
      "분과 정보",
      "분과 정보",
      "동아리 대표명칭",
      "I",
      "I",
      "I",
      "I",
      "I",
      "PART II - 대의원1 정보",
      "PART II - 대의원1 정보",
      "PART II - 대의원1 정보",
      "PART III - 대의원2 정보",
      "PART III - 대의원2 정보",
      "PART III - 대의원2 정보",
    ],
    [
      "분과구",
      "분과",
      "동아리 대표명칭",
      "성명",
      "학번",
      "학과",
      "휴대전화",
      "KAIST E-Mail",
      "성명",
      "학번",
      "학과",
      "성명",
      "학번",
      "학과",
    ],
    ["정동아리", ...new Array(13).fill("")],
  );
  aoa.push(["가동아리", ...new Array(13).fill("")]);
  aoa = [...aoa, ...provisionals.map(rowMap)];

  const sheet = XLSX.utils.aoa_to_sheet(aoa);

  const fillColor = fillColorOfSheet(sheet);

  for (let row = 0; row <= data.length + 4; row += 1) {
    [..."ABCDEFGHIJKLMN"].forEach(col => {
      if (sheet[`${col}${row}`]) {
        sheet[`${col}${row}`].s = structuredClone(commonCellStyle);
        if (row <= 2) {
          sheet[`${col}${row}`].s.font.bold = true;
        }
      }
    });

    if (sheet[`C${row}`]) {
      sheet[`C${row}`].s.border = {
        right: {
          color: {
            rgb: "000000",
          },
          style: "medium",
        },
      };
    }

    if (row <= 2) {
      if (sheet[`H${row}`]) {
        sheet[`H${row}`].s.border = {
          right: {
            color: {
              rgb: "000000",
            },
            style: "medium",
          },
        };
      }
    }
  }

  fillColor("A1:B2", "C9DAF8");
  fillColor("A3:B3", "FFF2CC");
  fillColor("C3:N3", "B7B7B7");
  fillColor("D1:N2", "B7E1CD");
  fillColor("C1:C2", "8AD3FF");
  fillColor(`B4:B${regulars.length + 3}`, "D9EAD3");
  fillColor(`A4:A${regulars.length + 3}`, "FFF2CC");
  fillColor(`C${regulars.length + 4}:N${regulars.length + 4}`, "B7B7B7");
  fillColor(`A${regulars.length + 4}:B${data.length + 4}`, "FCE5CD");
  fillColor(`B${regulars.length + 5}:B${data.length + 4}`, "F4CCCC");

  sheet["!cols"] = [
    6.33, 6.33, 16.44, 13.22, 8.33, 14, 11.89, 18.22, 15.56, 8.33, 14, 7.22,
    8.33, 18.22,
  ].map(colWidth);
  sheet["!merges"] = [
    { s: { c: 0, r: 0 }, e: { c: 1, r: 0 } },
    { s: { c: 2, r: 0 }, e: { c: 2, r: 1 } },
    { s: { c: 3, r: 0 }, e: { c: 7, r: 0 } },
    { s: { c: 8, r: 0 }, e: { c: 10, r: 0 } },
    { s: { c: 11, r: 0 }, e: { c: 13, r: 0 } },
  ];

  return sheet;
}

function createClubInfoOverviewSheet(data: ApiOvv002ResponseOK) {
  const regulars = data.filter(
    club => club.clubTypeEnum === ClubTypeEnum.Regular,
  );
  const provisionals = data.filter(
    club => club.clubTypeEnum === ClubTypeEnum.Provisional,
  );

  const rowMap = (row: ApiOvv002ResponseOK[number]) => [
    row.district,
    row.divisionName,
    row.clubNameKr,
    row.fieldsOfActivity,
    row.foundingYear,
    row.professor ?? "없음",
    row.totalMemberCnt ?? "없음",
    row.regularMemberCnt ?? "없음",
    row.clubBuildingEnum
      ? `${ClubBuildingEnum[row.clubBuildingEnum]}/${row.roomLocation ?? " -"}`
      : "없음",
    row.roomPassword ?? "없음",
    row.caution ?? "없음",
    row.warning ?? "없음",
  ];

  let aoa = regulars.map(rowMap);
  aoa.unshift(
    [
      "분과구",
      "분과",
      "동아리 대표명칭",
      "활동분야",
      "설립년도",
      "지도교수",
      "회원수",
      "정회원수",
      "동아리방 위치",
      "비번",
      "경고",
      "주의",
    ],
    ["정동아리", ...new Array(11).fill("")],
  );
  aoa.push(["가동아리", ...new Array(11).fill("")]);
  aoa = [...aoa, ...provisionals.map(rowMap)];

  const sheet = XLSX.utils.aoa_to_sheet(aoa);

  const fillColor = fillColorOfSheet(sheet);

  for (let row = 0; row <= data.length + 4; row += 1) {
    [..."ABCDEFGHIJKL"].forEach(col => {
      if (sheet[`${col}${row}`]) {
        sheet[`${col}${row}`].s = structuredClone(commonCellStyle);
        if (row <= 1) {
          sheet[`${col}${row}`].s.font.bold = true;
        }
      }
    });

    if (sheet[`C${row}`]) {
      sheet[`C${row}`].s.border = {
        right: {
          color: {
            rgb: "000000",
          },
          style: "medium",
        },
      };
    }
  }

  fillColor("A1:B1", "C9DAF8");
  fillColor("A2:B2", "FFF2CC");
  fillColor("C2:N2", "B7B7B7");
  fillColor("C1:L1", "8AD3FF");
  fillColor(`B3:B${regulars.length + 2}`, "D9EAD3");
  fillColor(`A3:A${regulars.length + 2}`, "FFF2CC");
  fillColor(`C${regulars.length + 3}:N${regulars.length + 3}`, "B7B7B7");
  fillColor(`A${regulars.length + 3}:B${data.length + 3}`, "FCE5CD");
  fillColor(`B${regulars.length + 4}:B${data.length + 3}`, "F4CCCC");

  sheet["!cols"] = [
    6.33, 6.33, 17.89, 26.33, 6.44, 7.0, 6.89, 6.89, 26, 10.56, 3.56, 3.56,
  ].map(colWidth);

  return sheet;
}

export function downloadDelegateOverviewExcel(
  data: ClubsOverviewData,
  year: number,
  semseterName: string,
) {
  if (!data.clubInfo || !data.delegates) {
    return;
  }

  const workbook = XLSX.utils.book_new();

  const delegateSheet = createDelegateOverviewSheet(data.delegates);
  const clubInfoSheet = createClubInfoOverviewSheet(data.clubInfo);

  XLSX.utils.book_append_sheet(workbook, delegateSheet, "동아리 대표자대의원");
  XLSX.utils.book_append_sheet(workbook, clubInfoSheet, "동아리 정보(KR)");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = `${year} ${semseterName} Clubs 정보 총람.xlsx`;
  downloadLink.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
