import {} from "drizzle-orm/mysql-core";

export interface Reservation {
  start: Date;
  end: Date;
}

export interface TermList {
  commonSpaceId: number;
  clubId: number;
  chargeStudentId: number;
  studentPhoneNumber: string;
  startTerm: Date;
  endTerm: Date;
}
