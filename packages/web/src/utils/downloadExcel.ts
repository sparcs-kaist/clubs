import * as XLSX from "xlsx";

export interface SheetData<T> {
  name: string;
  data: T[];
}

interface DownloadExcelOptions<T> {
  fileName?: string;
  sheets: SheetData<T>[];
}

export default function downloadExcel<T>({
  fileName = "data.xlsx",
  sheets,
}: DownloadExcelOptions<T>) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.click();
  URL.revokeObjectURL(url);
}
