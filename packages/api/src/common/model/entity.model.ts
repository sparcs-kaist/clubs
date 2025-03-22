export abstract class MEntity<T = number> {
  id: T;

  tableName: string;

  static from(_result: unknown): MEntity {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }
}
