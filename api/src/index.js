// Minimal local API for Hands-On Fitness — Postgres health + plan/today stub.
// Full Better Auth + R2 wiring comes after local DB is confirmed working.
import http from "node:http";
import pg from "pg";

const PORT = process.env.PORT || 3000;
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://hof:hof_dev_password@localhost:5432/hands_on_fitness",
});

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/health") {
    try {
      await pool.query("SELECT 1");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, db: "up" }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, db: "down", error: String(e) }));
    }
    return;
  }
  if (req.url === "/plan/today") {
    const { rows } = await pool
      .query(
        `SELECT s.id, s.type, s.duration_min FROM sessions s ORDER BY s.id LIMIT 5`
      )
      .catch(() => ({ rows: [] }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ date: new Date().toISOString().slice(0, 10), sessions: rows }));
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => console.log(`hof-api listening on :${PORT}`));
