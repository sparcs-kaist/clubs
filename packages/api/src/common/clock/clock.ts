export const CLOCK = Symbol("CLOCK");

export interface Clock {
  now(): Date;
  endOfToday(): Date;
}
