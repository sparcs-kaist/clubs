export abstract class MEntity<T = number> {
  id: T;

  modelName: string;

  static from(_result: unknown): MEntity<unknown> {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }

  static fieldMap<Query, DbResult>(_field: keyof Query): keyof DbResult {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }
}
