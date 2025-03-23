import { MySqlColumn } from "drizzle-orm/mysql-core";

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

  abstract set(_param: Partial<MEntity<T>>): MEntity<T>;
}
