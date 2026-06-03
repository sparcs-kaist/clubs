export const RANDOM_GENERATOR = Symbol("RANDOM_GENERATOR");

export interface RandomGenerator {
  uuid(): string;
  hex(bytes: number): string;
}
