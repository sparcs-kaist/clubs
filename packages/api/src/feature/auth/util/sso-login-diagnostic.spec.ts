import {
  boundDiagnosticJson,
  captureSsoProfile,
  redactDiagnosticText,
} from "./sso-login-diagnostic";

describe("SSO login diagnostic privacy boundaries", () => {
  it("records the independent V1 and V2 update dates as received", () => {
    expect(
      captureSsoProfile({
        kaist_info_time: "2024-09-01",
        kaist_v2_info_time: "2026-09-15",
      }),
    ).toMatchObject({
      fields: {
        kaist_info_time: {
          present: true,
          type: "string",
          value: "2024-09-01",
        },
        kaist_v2_info_time: {
          present: true,
          type: "string",
          value: "2026-09-15",
        },
      },
    });
  });

  it.each([1, "1", null, undefined])(
    "preserves academic field types and explicit undefined: %s",
    value => {
      const profile = captureSsoProfile({
        kaist_v2_info: {
          std_no: "20246000",
          std_prog_code: value,
          socps_cd: "S",
          std_status_kor: "재학",
        },
      });

      expect(profile).toMatchObject({
        kaist_v2_info: {
          type: "object",
          fields: {
            std_no: { present: true, type: "string", value: "20246000" },
            std_prog_code: {
              present: true,
              type: value === null ? "null" : typeof value,
              ...(value === undefined ? { omitted: true } : { value }),
            },
            socps_cd: { present: true, type: "string", value: "S" },
            std_status_kor: { present: true, type: "string", value: "재학" },
          },
        },
      });
    },
  );

  it("distinguishes omitted academic fields from explicit null", () => {
    const profile = captureSsoProfile({
      kaist_v2_info: JSON.stringify({ std_no: "20246000", socps_cd: null }),
    });

    expect(profile).toMatchObject({
      kaist_v2_info: {
        type: "string",
        fields: {
          std_prog_code: { present: false, type: "undefined", omitted: false },
          socps_cd: { present: true, type: "null", value: null },
        },
      },
    });
  });

  it("retains nested academic fields when the entire SSO profile is a JSON string", () => {
    const profile = captureSsoProfile(
      JSON.stringify({
        uid: "sso-user",
        kaist_v2_info: {
          std_no: "20246000",
          std_prog_code: 1,
          socps_cd: "S",
          std_status_kor: null,
        },
        access_token: "excluded-secret",
      }),
    );

    expect(profile).toMatchObject({
      type: "string",
      state: "available",
      kaist_v2_info: {
        type: "object",
        fields: {
          std_no: { present: true, type: "string", value: "20246000" },
          std_prog_code: { present: true, type: "number", value: 1 },
          socps_cd: { present: true, type: "string", value: "S" },
          std_status_kor: { present: true, type: "null", value: null },
        },
      },
    });
    expect(JSON.stringify(profile)).not.toContain("excluded-secret");
  });

  it("discards unlisted authentication fields and nested objects in allowed fields", () => {
    const profile = captureSsoProfile({
      password: "password-secret",
      access_token: "access-secret",
      cookie: "cookie-secret",
      kaist_info: {
        ku_acad_prog_code: "0",
        authorization: "authorization-secret",
      },
      kaist_v2_info: JSON.stringify({
        std_no: "20246000",
        std_prog_code: { code: "nested-secret" },
        socps_cd: ["array-secret"],
        refresh_token: "refresh-secret",
        signature: "signature-secret",
        client_secret: "client-secret",
      }),
    });

    expect(JSON.stringify(profile)).not.toContain("secret");
    expect(profile).toMatchObject({
      kaist_v2_info: {
        fields: {
          std_prog_code: { type: "object", omitted: true },
          socps_cd: { type: "array", omitted: true },
        },
      },
    });
  });

  it("keeps malformed JSON diagnostics without storing parser input", () => {
    const profile = captureSsoProfile({
      kaist_info: '{"password":"legacy-secret"',
      kaist_v2_info: '{"refresh_token":"refresh-secret"',
    });

    expect(profile).toMatchObject({
      kaist_info: { type: "string", state: "parse_failed" },
      kaist_v2_info: { type: "string", state: "parse_failed" },
    });
    expect(JSON.stringify(profile)).not.toContain("secret");
  });

  it.each([
    [undefined, "missing"],
    [null, "null"],
    [[], "invalid_shape"],
    [true, "invalid_shape"],
  ])("distinguishes unusable V2 profile %s", (value, state) => {
    expect(captureSsoProfile({ kaist_v2_info: value })).toMatchObject({
      kaist_v2_info: { state },
    });
  });

  it.each([
    'password="secret-tail"',
    "passwd='secret-tail'",
    "access_token=secret-tail&next=/",
    "refreshToken: secret-tail",
    "client_secret = secret-tail",
    "signature=secret-tail",
    "Authorization: Bearer secret-tail",
    "Authorization: Basic secret-tail",
    JSON.stringify({ password: 'prefix"secret-tail' }),
    "password='prefix\\'secret-tail'",
    "Cookie: session=first-value; auxiliary=secret-tail",
  ])("redacts authentication values from arbitrary error text: %s", input => {
    expect(redactDiagnosticText(input, [])).not.toContain("secret-tail");
  });

  it("removes known credentials wherever error text quotes or encodes them", () => {
    const secrets = [
      'callback-code/+"secret',
      "callback-state-secret",
      "session=cookie-secret; preference=preference-secret",
      "Bearer authorization-secret",
    ];
    const variants = secrets.flatMap(secret => [
      secret,
      encodeURIComponent(secret),
      JSON.stringify(secret).slice(1, -1),
    ]);
    const result = redactDiagnosticText(variants.join("\n"), secrets);

    variants.forEach(secret => expect(result).not.toContain(secret));
    expect(result).toContain("[REDACTED]");
  });

  it("redacts connection-string credentials while retaining the endpoint", () => {
    const result = redactDiagnosticText(
      "Failed to connect to mysql://db-user:database-secret@db.test:3306/clubs",
      [],
    );

    expect(result).not.toContain("database-secret");
    expect(result).toContain("db.test:3306/clubs");
  });

  it("redacts a known Authorization bearer token even when quoted without its scheme", () => {
    const result = redactDiagnosticText(
      'Authentication failed near "opaque-auth-secret"',
      ["Bearer opaque-auth-secret"],
    );

    expect(result).not.toContain("opaque-auth-secret");
  });

  it("redacts short credentials once without expanding the redaction marker", () => {
    expect(redactDiagnosticText("E D", ["E", "D"])).toBe(
      "[REDACTED] [REDACTED]",
    );
  });

  it("redacts a lone-surrogate credential without failing URL encoding", () => {
    const secret = "\uD800";
    expect(redactDiagnosticText(`before ${secret} after`, [secret])).toBe(
      "before [REDACTED] after",
    );
    expect(redactDiagnosticText(JSON.stringify(secret), [secret])).toBe(
      '"[REDACTED]"',
    );
  });

  it("does not mutate a frozen credential list or frozen profile", () => {
    const secrets = ["short-secret", "much-longer-secret"];
    Object.freeze(secrets);
    const academic = Object.freeze({ std_no: "20246000", std_prog_code: 1 });
    const profile = Object.freeze({ kaist_v2_info: academic });
    const result = boundDiagnosticJson(
      {
        profile: captureSsoProfile(profile),
        message: "short-secret much-longer-secret",
      },
      secrets,
    );

    expect(JSON.stringify(result)).not.toContain("secret");
    expect(secrets).toEqual(["short-secret", "much-longer-secret"]);
    expect(profile.kaist_v2_info).toBe(academic);
  });

  it("preserves the critical profile and queried DB context at normal size", () => {
    const now = new Date("2026-09-15T08:29:16.000Z");
    const result = boundDiagnosticJson(
      {
        sso: {
          profile: captureSsoProfile({
            kaist_v2_info: {
              std_no: "20246000",
              std_prog_code: 1,
              socps_cd: "S",
              std_status_kor: "재학",
            },
          }),
        },
        db: {
          currentStudent: { id: 13, number: 20246000, userId: 4 },
          currentStudentTerms: { queriedAt: now, rows: [] },
          resolvingStudent: { id: 13, number: 20246000, source: "current" },
        },
      },
      [],
    );

    expect(result.truncated).toEqual([]);
    expect(result.data).toMatchObject({
      sso: {
        profile: {
          kaist_v2_info: {
            fields: {
              std_prog_code: { present: true, type: "number", value: 1 },
            },
          },
        },
      },
      db: {
        currentStudentTerms: { queriedAt: now.toISOString(), rows: [] },
        resolvingStudent: { id: 13, number: 20246000, source: "current" },
      },
    });
  });

  it("omits oversized input before parsing or redacting its contents", () => {
    const oversized = `{"std_prog_code":"${"x".repeat(65536)}private-secret"}`;
    const parse = jest.spyOn(JSON, "parse");
    try {
      expect(captureSsoProfile({ kaist_v2_info: oversized })).toMatchObject({
        kaist_v2_info: {
          type: "string",
          state: "too_large",
          length: oversized.length,
        },
      });
      expect(parse).not.toHaveBeenCalled();
    } finally {
      parse.mockRestore();
    }
    expect(redactDiagnosticText(oversized, ["private-secret"])).toBe(
      "[TRUNCATED]",
    );
    expect(
      boundDiagnosticJson({ field: oversized }, ["private-secret"]),
    ).toEqual({
      data: { field: "[TRUNCATED]" },
      truncated: ["$.field"],
    });
  });

  it("marks truncation while bounding oversized strings and DB arrays", () => {
    const result = boundDiagnosticJson(
      {
        sso: {
          profile: captureSsoProfile({
            kaist_v2_info: {
              std_no: "20246000",
              std_prog_code: 1,
              std_status_kor: "재학".repeat(2000),
            },
          }),
        },
        db: {
          linkedStudents: Array.from({ length: 1000 }, (_, id) => ({
            id,
            number: 20246000 + id,
            userId: 4,
          })),
          linkedStudentTerms: {
            rows: Array.from({ length: 1000 }, (_, id) => ({
              id,
              studentId: id,
              studentEnum: 2,
            })),
          },
        },
      },
      [],
    );
    const serialized = JSON.stringify(result);

    expect(result.truncated).toContain(
      "$.sso.profile.kaist_v2_info.fields.std_status_kor.value",
    );
    expect(result.truncated).toContain("$.db.linkedStudents");
    expect(serialized).toContain("[TRUNCATED]");
    expect(Buffer.byteLength(serialized)).toBeLessThanOrEqual(64 * 1024);
  });

  it("bounds final serialized JSON after control-character escaping", () => {
    const escaped = "\u0000".repeat(1024);
    const fields = [
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
    const result = boundDiagnosticJson(
      {
        sso: {
          profile: captureSsoProfile({
            kaist_v2_info: Object.fromEntries(
              fields.map(field => [field, escaped]),
            ),
          }),
        },
      },
      [],
    );

    expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThanOrEqual(
      64 * 1024,
    );
    expect(result.truncated.length).toBeGreaterThan(0);
  });
});
