// One-off: create the memoryvault database on prod CRDB (idempotent).
import postgres from "postgres";

const url = process.env.PROD_DB_ADMIN_URL;
if (!url) throw new Error("Set PROD_DB_ADMIN_URL");

const sql = postgres(url, { max: 1, connect_timeout: 15 });
const result = await sql.unsafe("CREATE DATABASE IF NOT EXISTS memoryvault");
console.log("create database ok");
const rows = await sql.unsafe("SHOW DATABASES");
console.log(rows.map((r) => r.database_name).join(", "));
await sql.end();
