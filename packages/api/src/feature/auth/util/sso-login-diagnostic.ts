export interface SsoLoginDiagnostic {
  stage: string;
  sso?: Record<string, unknown>;
  db?: Record<string, unknown>;
  userId?: number;
  studentId?: number;
  failure?: {
    name: string;
    message: string;
    httpStatus: number;
    stack?: string;
  };
  secrets?: string[];
}

const v2Fields = [
  "std_no",
  "std_prog_code",
  "socps_cd",
  "std_status_kor",
  "std_dept_id",
  "std_dept_kor_nm",
  "std_dept_eng_nm",
  "kaist_uid",
  "user_id",
  "user_nm",
  "email",
  "login_type",
  "ebs_user_status_kor",
  "camps_div_cd",
  "kaist_org_id",
  "emp_no",
  "emp_dept_id",
  "emp_dept_kor_nm",
  "emp_dept_eng_nm",
  "emp_status_kor",
];
const v1Fields = [
  "ku_std_no",
  "kaist_uid",
  "ku_psft_user_status_kor",
  "employeeType",
  "ku_person_type",
  "ku_kaist_org_id",
  "ku_psft_user_status",
  "ku_acad_prog_code",
];

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function captureFields(value: object, fields: string[]) {
  return Object.fromEntries(
    fields.map(key => {
      const present = Object.prototype.hasOwnProperty.call(value, key);
      const field = value[key];
      const type = valueType(field);
      if (["string", "number", "boolean", "null"].includes(type)) {
        return [key, { present, type, value: field }];
      }
      return [key, { present, type, omitted: present }];
    }),
  );
}

function captureProfilePart(raw: unknown, fields: string[]) {
  const type = valueType(raw);
  let value = raw;
  if (typeof raw === "string") {
    if (raw.length > 65536)
      return { type, state: "too_large", length: raw.length };
    try {
      value = JSON.parse(raw);
    } catch {
      // A JSON parser message can quote credentials from the input.
      return { type, state: "parse_failed", length: raw.length };
    }
  }
  if (value === null) return { type, state: "null" };
  if (value === undefined) return { type, state: "missing" };
  if (typeof value !== "object") return { type, state: "invalid_shape" };
  if (Array.isArray(value)) return { type, state: "invalid_shape" };
  return { type, state: "available", fields: captureFields(value, fields) };
}

/** Copy only diagnostic fields, before the SSO client mutates parsed profiles. */
export function captureSsoProfile(profile: unknown): Record<string, unknown> {
  const result = captureProfilePart(profile, [
    "uid",
    "sid",
    "kaist_id",
    "email",
  ]);
  if (result.state !== "available") return result;
  const source = (
    typeof profile === "string" ? JSON.parse(profile) : profile
  ) as Record<string, unknown>;
  return {
    ...result,
    kaist_info: captureProfilePart(source.kaist_info, v1Fields),
    kaist_v2_info: captureProfilePart(source.kaist_v2_info, v2Fields),
  };
}

/** Known authentication values never enter persisted messages or JSON. */
export function redactDiagnosticText(text: string, secrets: string[]): string {
  // Omit oversized input whole: slicing first could expose a partial credential.
  if (text.length > 65536) return "[TRUNCATED]";
  const values = secrets.flatMap(secret => {
    let encoded = "";
    try {
      encoded = encodeURIComponent(secret);
    } catch {
      /* Raw and JSON-escaped forms still cover malformed Unicode. */
    }
    return [
      secret,
      secret.replace(/^(?:Bearer|Basic)\s+/i, ""),
      encoded,
      JSON.stringify(secret).slice(1, -1),
    ];
  });
  const patterns = [...new Set(values.filter(Boolean))]
    .sort((a, b) => b.length - a.length)
    .map(value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // One pass prevents short credentials from repeatedly expanding the marker.
  const result =
    patterns.length === 0
      ? text
      : text.replace(new RegExp(patterns.join("|"), "g"), "[REDACTED]");
  return result
    .replace(/([a-z][a-z\d+.-]*:\/\/)[^/\s:@]+:[^@\s/]*@/gi, "$1[REDACTED]@")
    .replace(/\b(?:Bearer|Basic)\s+[^\s,;"']+/gi, "[REDACTED]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED]",
    )
    .replace(
      /((?:["']?)(?:authorization|cookie|password|passwd|code|state|access[_-]?token|refresh[_-]?token|client[_-]?secret|secret[_-]?key|sign(?:ature)?)["']?\s*[:=]\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\r\n]*)/gi,
      "$1[REDACTED]",
    );
}

/** Input is composed only by the allowlists above and repository snapshots. */
export function boundDiagnosticJson(input: unknown, secrets: string[]) {
  const truncated: string[] = [];
  let remaining = 24000;
  function visit(value: unknown, path: string, depth: number): unknown {
    if (remaining <= 0) {
      truncated.push(path);
      return "[TRUNCATED]";
    }
    remaining -= 64;
    if (depth > 10) {
      truncated.push(path);
      return "[TRUNCATED]";
    }
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") {
      if (value.length > 65536) {
        truncated.push(path);
        return "[TRUNCATED]";
      }
      const safe = redactDiagnosticText(value, secrets);
      const limit = Math.max(0, Math.min(1024, remaining));
      const prefix = Buffer.from(safe).subarray(0, limit).toString("utf8");
      remaining -= Buffer.byteLength(JSON.stringify(prefix));
      if (Buffer.byteLength(safe) > limit) {
        truncated.push(path);
        return `${prefix}[TRUNCATED]`;
      }
      return safe;
    }
    if (value === null) return null;
    if (Array.isArray(value)) {
      if (value.length > 32) truncated.push(path);
      return value
        .slice(0, 32)
        .map((item, i) => visit(item, `${path}.${i}`, depth + 1));
    }
    if (typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length > 64) truncated.push(path);
      return Object.fromEntries(
        entries
          .slice(0, 64)
          .map(([key, item]) => [
            key,
            visit(item, `${path}.${key}`, depth + 1),
          ]),
      );
    }
    if (typeof value === "number")
      return Number.isFinite(value) ? value : String(value);
    if (typeof value === "boolean") return value;
    return null;
  }
  const data = visit(input, "$", 0);
  const result = { data, truncated };
  // Include JSON escaping and marker/key overhead in the final hard limit.
  if (Buffer.byteLength(JSON.stringify(result)) > 65536) {
    return { data: "[TRUNCATED]", truncated: ["$"] };
  }
  return result;
}
