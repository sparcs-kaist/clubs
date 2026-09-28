import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import mysql from "mysql2/promise";

import { assertDatabaseUrlUsesTestDatabase } from "../../scripts/database-url-safety.mjs";

const enumTables = [
  "activity_certificate_status_enum",
  "activity_status_enum",
  "activity_type_enum",
  "club_building_enum",
  "club_delegate_change_request_status_enum",
  "club_delegate_enum",
  "club_status_enum",
  "common_space_enum",
  "executive_bureau_enum",
  "executive_status_enum",
  "meeting_role_enum",
  "professor_enum",
  "promotional_printing_order_status_enum",
  "promotional_printing_size_enum",
  "registration_application_student_status_enum",
  "registration_status_enum",
  "registration_type_enum",
  "rental_enum",
  "student_enum",
  "student_status_enum",
];

test("enum migration preserves business data, indexes and unrelated FKs", async () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assertDatabaseUrlUsesTestDatabase(databaseUrl, {
    variableName: "TEST_DATABASE_URL",
  });
  const connection = await mysql.createConnection(databaseUrl);
  const database = `clubs_tu507_test_${randomUUID().replaceAll("-", "")}`;
  const migration = await readFile(
    new URL("./TU-507-drop-enum-tables.sql", import.meta.url),
    "utf8",
  );
  const runMigration = async () => {
    let delimiter = ";";
    let statement = "";
    for (const line of migration.split("\n")) {
      if (line.startsWith("DELIMITER ")) {
        delimiter = line.slice("DELIMITER ".length);
      } else {
        statement += `${line}\n`;
        if (statement.trimEnd().endsWith(delimiter)) {
          await connection.query(
            statement.trimEnd().slice(0, -delimiter.length),
          );
          statement = "";
        }
      }
    }
    assert.equal(statement.trim(), "");
  };

  try {
    await connection.query(`CREATE DATABASE \`${database}\``);
    await connection.query(`USE \`${database}\``);
    // Fresh installs and a repeated execution must both work without enum tables.
    await runMigration();
    for (const table of enumTables) {
      await connection.query(`CREATE TABLE ${table} (id INT PRIMARY KEY)`);
      await connection.query(`INSERT INTO ${table} VALUES (1)`);
    }
    await connection.query("CREATE TABLE unrelated_enum (id INT PRIMARY KEY)");
    await connection.query("INSERT INTO unrelated_enum VALUES (1)");
    await connection.query(`CREATE TABLE business (
      id INT PRIMARY KEY,
      unrelated_id INT NOT NULL,
      ${enumTables.map((_, i) => `code_${i} INT NOT NULL`).join(", ")},
      CONSTRAINT keep_unrelated_fk FOREIGN KEY (unrelated_id) REFERENCES unrelated_enum(id),
      ${enumTables
        .map(
          (table, i) =>
            `CONSTRAINT \`enum\`\`fk_${i}\` FOREIGN KEY (code_${i}) REFERENCES ${table}(id)`,
        )
        .join(", ")}
    )`);
    await connection.query(
      `INSERT INTO business VALUES (1, 1, ${enumTables.map(() => "1").join(", ")})`,
    );
    await connection.query(`CREATE TABLE second_business (
      id INT PRIMARY KEY,
      code INT,
      FOREIGN KEY (code) REFERENCES student_enum(id)
    )`);
    await connection.query("INSERT INTO second_business VALUES (1, 1)");
    const [before] = await connection.query("SELECT * FROM business");
    const [indexesBefore] = await connection.query("SHOW INDEX FROM business");
    await runMigration();
    await runMigration();
    const [tables] = await connection.query("SHOW TABLES");
    assert.deepEqual(tables.map(row => Object.values(row)[0]).sort(), [
      "business",
      "second_business",
      "unrelated_enum",
    ]);
    const [after] = await connection.query("SELECT * FROM business");
    assert.deepEqual(after, before);
    const [second] = await connection.query("SELECT * FROM second_business");
    assert.deepEqual(second, [{ id: 1, code: 1 }]);
    const [indexesAfter] = await connection.query("SHOW INDEX FROM business");
    const indexShape = indexes =>
      indexes.map(({ Key_name, Column_name, Non_unique, Seq_in_index }) => ({
        Key_name,
        Column_name,
        Non_unique,
        Seq_in_index,
      }));
    assert.deepEqual(indexShape(indexesAfter), indexShape(indexesBefore));
    const [foreignKeys] = await connection.query(
      "SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()",
    );
    assert.deepEqual(foreignKeys, [{ CONSTRAINT_NAME: "keep_unrelated_fk" }]);
    await connection.query("UPDATE business SET code_0 = 999 WHERE id = 1");
    await assert.rejects(
      connection.query("UPDATE business SET unrelated_id = 999 WHERE id = 1"),
      { code: "ER_NO_REFERENCED_ROW_2" },
    );
    const [routines] = await connection.query(
      "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()",
    );
    assert.deepEqual(routines, []);
  } finally {
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await connection.end();
  }
});
