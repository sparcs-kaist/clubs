import * as assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const tableFiles = [
  {
    fileName: "CurrentActivityReportTable.tsx",
    maxApprovalSize: 14,
  },
  {
    fileName: "professor/ProfessorActivityReportTable.tsx",
    maxApprovalSize: 16,
  },
];

const extractColumnSizes = (source: string) =>
  Array.from(source.matchAll(/header:\s*"([^"]+)"[\s\S]*?size:\s*(\d+)/gu)).map(
    match => ({
      header: match[1],
      size: Number(match[2]),
    }),
  );

describe("activity report table column widths", () => {
  tableFiles.forEach(({ fileName, maxApprovalSize }) => {
    it(`${fileName} keeps approval columns compact`, () => {
      const source = readFileSync(new URL(fileName, import.meta.url), "utf8");
      const columns = extractColumnSizes(source);
      const totalSize = columns.reduce(
        (total, column) => total + column.size,
        0,
      );
      const approvalColumns = columns.filter(column =>
        column.header.includes("승인"),
      );

      assert.equal(totalSize, 100);
      assert.ok(approvalColumns.length > 0);

      approvalColumns.forEach(column => {
        assert.ok(
          column.size <= maxApprovalSize,
          `${column.header} should be ${maxApprovalSize}% or narrower`,
        );
      });
    });
  });
});
