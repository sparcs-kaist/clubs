import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";

// Isolated MySQL fixture: no host ports, credentials, or application DATABASE_URL.
const container = `clubs-tu491-dml-test-${process.pid}`;
const sql = readFileSync(
  new URL("./TU-491-remove-auto-approved-delegates.sql", import.meta.url),
  "utf8",
);
const docker = args => execFileSync("docker", args, { encoding: "utf8" });
const query = input =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "mysql",
      "-uroot",
      "--batch",
      "--skip-column-names",
    ],
    { input, encoding: "utf8" },
  );

try {
  docker([
    "run",
    "--detach",
    "--rm",
    "--name",
    container,
    "--env",
    "MYSQL_ALLOW_EMPTY_PASSWORD=yes",
    "mysql:8.0.36",
  ]);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      docker(["exec", container, "mysqladmin", "ping", "--silent"]);
      ready = true;
      break;
    } catch {
      await setTimeout(500);
    }
  }
  assert.ok(ready, "isolated MySQL did not become ready");
  query(`
    CREATE DATABASE fixture;
    USE fixture;
    SET SESSION time_zone = '+09:00';
    CREATE TABLE semester_d (id INT PRIMARY KEY, start_term DATETIME, end_term DATETIME, deleted_at TIMESTAMP NULL);
    CREATE TABLE student (id INT PRIMARY KEY, name TEXT, number INT);
    CREATE TABLE registration (id INT PRIMARY KEY, club_id INT, student_id INT, semester_d_id INT, registration_application_status_enum_id INT, reviewed_at TIMESTAMP, deleted_at TIMESTAMP NULL);
    CREATE TABLE club_t (id INT PRIMARY KEY, club_id INT, semester_id INT, start_term DATETIME, end_term DATETIME, deleted_at TIMESTAMP NULL);
    CREATE TABLE club_student_t (id INT PRIMARY KEY, club_id INT, student_id INT, semester_id INT, start_term DATETIME, end_term DATETIME, created_at TIMESTAMP, deleted_at TIMESTAMP NULL);
    CREATE TABLE registration_application_student (id INT PRIMARY KEY, club_id INT, student_id INT, semester_d_id INT, registration_application_student_status_enum INT, created_at TIMESTAMP, deleted_at TIMESTAMP NULL);
    CREATE TABLE club_delegate_d (id INT PRIMARY KEY, club_id INT, student_id INT, club_delegate_enum_id INT, start_term DATETIME, end_term DATETIME, created_at TIMESTAMP, deleted_at TIMESTAMP NULL);
    -- Equal semester boundaries must not select semester 200 instead of 201.
    INSERT INTO semester_d VALUES (200, '2025-09-01', '2026-03-01', NULL), (201, '2026-03-01', '2026-08-28 23:59:00', NULL), (202, '2026-08-28 23:59:00', '2027-02-28 23:59:00', NULL);
    INSERT INTO student VALUES (10, 'applicant', 10), (11, 'auto delegate', 11), (12, 'ended delegate', 12), (13, 'ordinary member', 13), (14, 'preexisting application', 14), (15, 'later legitimate member', 15), (16, 'other semester', 16), (20, 'other applicant', 20), (21, 'different representative', 21), (22, 'excluded delegate', 22);
    INSERT INTO registration VALUES (1, 42, 10, 202, 2, '2026-09-01 10:00:00', NULL), (2, 43, 20, 202, 2, '2026-09-01 10:00:00', NULL);
    INSERT INTO club_t VALUES (1, 42, 202, '2026-08-28 23:59:00', '2027-02-28 23:59:00', NULL), (2, 43, 202, '2026-08-28 23:59:00', '2027-02-28 23:59:00', NULL);
    INSERT INTO club_student_t
    SELECT id + 190, IF(id = 22, 43, 42), id, IF(id = 16, 201, 202), '2026-08-28 23:59:00', '2027-02-28 23:59:00', IF(id = 15, '2026-09-02 10:00:00', '2026-09-01 10:00:01'), NULL FROM student WHERE id <= 16 OR id = 22;
    INSERT INTO registration_application_student
    SELECT id + 90, IF(id = 22, 43, 42), id, IF(id = 16, 201, 202), 2, CASE id WHEN 14 THEN '2026-08-31 10:00:00' WHEN 15 THEN '2026-09-02 10:00:00' ELSE '2026-09-01 10:00:01' END, NULL FROM student WHERE id <= 16 OR id = 22;
    INSERT INTO club_delegate_d
    SELECT id, IF(id >= 20, 43, 42), id, IF(id IN (10, 21), 1, 2), '2026-03-01', IF(id = 12, '2026-08-27 23:59:00', NULL), '2026-03-01', NULL FROM student WHERE id NOT IN (13, 20);
  `);

  const picked = sql
    .replace("SET @semester_id = NULL;", "SET @semester_id = 202;")
    .replace(
      "SET @cleanup_at = NOW();",
      "SET @cleanup_at = '2026-09-08 12:00:00';",
    )
    .replace(
      "-- INSERT INTO tu491_reviewed VALUES (registration_id, student_id, application_id, member_id);",
      "INSERT INTO tu491_reviewed VALUES (1,10,100,200),(1,11,101,201),(1,12,102,202),(1,13,103,203),(1,14,104,204),(1,15,105,205),(1,16,106,206),(2,22,112,212);",
    );
  const deleted = () =>
    query(`USE fixture;
    SELECT id FROM club_student_t WHERE deleted_at IS NOT NULL ORDER BY id;
    SELECT id FROM registration_application_student WHERE deleted_at IS NOT NULL ORDER BY id;
  `).trim();

  query(`USE fixture; ${picked}`);
  assert.equal(deleted(), "", "the default ROLLBACK must preserve all records");
  query(`USE fixture; ${sql.replace(/ROLLBACK;\s*$/, "COMMIT;")}`);
  assert.equal(deleted(), "", "missing semester/allowlist must change nothing");
  query(`USE fixture; ${picked.replace(/ROLLBACK;\s*$/, "COMMIT;")}`);
  assert.equal(
    deleted(),
    "201\n202\n101\n102",
    "only verified auto-created delegate pairs may be deleted",
  );
  assert.equal(
    query(
      `USE fixture; SELECT id FROM club_delegate_d WHERE end_term = '2026-08-27 23:59:00' ORDER BY id;`,
    ).trim(),
    "11\n12",
    "use the immediate previous semester at equal boundaries and preserve already-ended history",
  );
  query(`USE fixture; ${picked.replace(/ROLLBACK;\s*$/, "COMMIT;")}`);
  assert.equal(
    deleted(),
    "201\n202\n101\n102",
    "repeated cleanup must not expand targets",
  );
  console.log(
    "TU-491 DML fixture passed: rollback, scope, applicant, ordinary members, existing applications, history, and idempotence.",
  );
} finally {
  docker(["rm", "--force", container]);
}
