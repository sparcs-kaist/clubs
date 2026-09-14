import { useTranslations } from "next-intl";
import React from "react";

import TableCell from "./TableCell";

interface TableRowNoneProp {
  text?: string;
}

const TableRowNone: React.FC<TableRowNoneProp> = ({ text }) => {
  const t = useTranslations("common");
  return (
    <TableCell type="None" width="100%">
      {text ?? t("noRecentHistory")}
    </TableCell>
  );
};

export default TableRowNone;
