import postgres from "postgres";
const sql = postgres(process.env.PROD_DB_URL, { max: 1, connect_timeout: 15 });
const rows = await sql.unsafe("SHOW TABLES");
console.log(rows.map((r) => r.table_name).join(", ") || "(no tables)");
await sql.end();
