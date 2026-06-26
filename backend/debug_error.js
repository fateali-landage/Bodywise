import pg from "pg";
const { Client } = pg;

const host = "aws-0-ap-south-1.pooler.supabase.com";
const port = 6543;
const user = "postgres.eittkokstntbpbdhgstj";
const database = "postgres";
const password = "F9@Fateali9886";

const run = async () => {
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log("Connected!");
    await client.end();
  } catch (err) {
    console.log("=== ERROR DETAILS ===");
    console.log("Message:", err.message);
    console.log("Code:", err.code);
    console.log("Stack:", err.stack);
    console.log("Keys:", Object.keys(err));
    console.log("Full error:", JSON.stringify(err, null, 2));
  }
};

run();
