import { MySqlColumn } from "drizzle-orm/mysql-core";

import { OperationType } from "@sparcs-clubs/interface/common/utils/field-operations";

export type IdType = number | string;

export abstract class MEntity<T extends IdType = number> {
  id: T;

  static modelName: string;

  static from(_result: unknown): MEntity<IdType> {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }

  static fieldMap(_field: unknown): MySqlColumn {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }

  to(_operation: OperationType): unknown {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }

  set(param: Partial<this>): this {
    Object.assign(this, param);
    return this;
  }
}
