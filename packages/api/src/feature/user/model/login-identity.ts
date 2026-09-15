export interface LoginIdentity {
  id: number;
  sid: string;
  name: string;
  email: string;
  undergraduate?: { id: number; number: number };
  master?: { id: number; number: number };
  doctor?: { id: number; number: number };
  masterDoctorDoctor?: { id: number; number: number };
  masterDoctorMaster?: { id: number; number: number };
  allPrograms?: { id: number; number: number };
  auditor?: { id: number; number: number };
  executive?: { id: number; studentId: number };
  professor?: { id: number; email?: string };
  employee?: { id: number; email?: string };
}

export interface SsoIdentityInput {
  email: string;
  studentNumber: string;
  sid: string;
  name: string;
  type: string;
  department: string;
  typeV2: string;
  statusV2: string | null;
  progCodeV2: string | null;
}

export interface LoginSemester {
  id: number;
  startTerm: Date;
  endTerm: Date;
}

export interface IdentitySyncDiagnostic {
  stage: string;
  db?: Record<string, unknown>;
  userId?: number;
  studentId?: number;
}

export class UserIdentitySyncError extends Error {
  constructor(
    readonly cause: unknown,
    readonly diagnostic: IdentitySyncDiagnostic,
  ) {
    super("User identity synchronization failed");
    this.name = "UserIdentitySyncError";
  }
}
