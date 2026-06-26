import pg from "pg";
const { Client } = pg;

const passwords = [
  "F9@Fateali9886",
  "9886",
  "F15@Fateali2004",
  "postgres",
  "password"
];

const tryConnect = async (password, port) => {
  const encodedPass = encodeURIComponent(password);
  const connectionString = `postgresql://postgres.eittkokstntbpbdhgstj:${encodedPass}@aws-0-ap-south-1.pooler.supabase.com:${port}/postgres?sslmode=require`;
  
  console.log(`Connecting with URI to port ${port} using password "${password}"...`);
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS! Connected to port ${port} with password "${password}"`);
    const res = await client.query("SELECT NOW()");
    console.log("Time:", res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log("Failed:", err.message);
    return false;
  }
};

const run = async () => {
  for (const port of [6543, 5432]) {
    for (const password of passwords) {
      const ok = await tryConnect(password, port);
      if (ok) process.exit(0);
    }
  }
  console.log("All connection string URI attempts failed.");
  process.exit(1);
};

run();
