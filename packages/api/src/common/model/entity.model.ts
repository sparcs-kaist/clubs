export abstract class MEntity<T = number> {
  id: T;

  modelName: string;

  static from(_result: unknown): MEntity {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }

  static fieldMap(_field: unknown) {
    throw new Error("Method not implemented. Must be overridden by subclass");
  }
}
