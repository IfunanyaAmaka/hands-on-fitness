// Hands-On Fitness API — Phases 1-3, 5-6 (local).
// Ph1: POST/GET/PATCH /users (goal/level/time_budget_min, validated per PRD §5.1)
// Ph2: GET /sessions + GET /sessions/:id (with ordered steps)
// Ph3: GET /plan/today?user_id= (profile-matched) + POST /plan/swap
// Ph4: POST /completions (session_started/completed306)
// Ph5: POST /water + GET /tips ; Ph6: GET /progress/:userId (streak + totals)
import http from "node:http";
import pg from "pg";

const PORT = process.env.PORT || 3000;
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://hof:hof_dev_password@localhost:5432/hands_on_fitness",
});

const GOALS = ["weight_loss", "strength", "flexibility", "stress_relief"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const TIMES = [10, 20, 30];

const send = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
};
const readBody = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      try {
        resolve(b ? JSON.parse(b) : {});
      } catch {
        resolve(null);
      }
    });
  });
const validProfile = (p) =>
  p &&
  GOALS.includes(p.goal) &&
  LEVELS.includes(p.level) &&
  TIMES.includes(Number(p.time_budget_min));

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url, "http://x");
  const path = url.pathname;

  try {
    if (path === "/health" && req.method === "GET") {
      await pool.query("SELECT 1");
      return send(res, 200, { ok: true, db: "up", phases: "0-6" });
    }

    // ---- Phase 1: onboarding ----
    if (path === "/users" && req.method === "POST") {
      const b = await readBody(req);
      if (!validProfile(b))
        return send(res, 400, {
          error: "invalid profile",
          expect: { goal: GOALS, level: LEVELS, time_budget_min: TIMES },
        });
      const { rows } = await pool.query(
        `INSERT INTO users (goal, level, time_budget_min) VALUES ($1,$2,$3) RETURNING *`,
        [b.goal, b.level, Number(b.time_budget_min)]
      );
      console.log("analytics: onboarding_completed", rows[0].id);
      return send(res, 201, rows[0]);
    }
    let m = path.match(/^\/users\/([0-9a-f-]{36})$/);
    if (m && req.method === "GET") {
      const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1`, [m[1]]);
      return rows.length ? send(res, 200, rows[0]) : send(res, 404, { error: "user not found" });
    }
    if (m && req.method === "PATCH") {
      const b = await readBody(req);
      if (!validProfile(b)) return send(res, 400, { error: "invalid profile" });
      const { rows } = await pool.query(
        `UPDATE users SET goal=$1, level=$2, time_budget_min=$3 WHERE id=$4 RETURNING *`,
        [b.goal, b.level, Number(b.time_budget_min), m[1]]
      );
      return rows.length ? send(res, 200, rows[0]) : send(res, 404, { error: "user not found" });
    }

    // ---- Phase 2: content library ----
    if (path === "/sessions" && req.method === "GET") {
      const { goal, level, type, duration_min } = Object.fromEntries(url.searchParams);
      const conds = [], vals = [];
      if (goal) { vals.push(goal); conds.push(`s.goal=$${vals.length}`); }
      if (level) { vals.push(level); conds.push(`s.level=$${vals.length}`); }
      if (type) { vals.push(type); conds.push(`s.type=$${vals.length}`); }
      if (duration_min) { vals.push(Number(duration_min)); conds.push(`s.duration_min=$${vals.length}`); }
      const { rows } = await pool.query(
        `SELECT s.*, COALESCE(SUM(st.duration_sec),0)::int AS total_secs, COUNT(st.id)::int AS step_count
         FROM sessions s LEFT JOIN steps st ON st.session_id=s.id
         ${conds.length ? "WHERE " + conds.join(" AND ") : ""} GROUP BY s.id ORDER BY s.id`,
        vals
      );
      return send(res, 200, rows);
    }
    m = path.match(/^\/sessions\/([A-Za-z0-9-]+)$/);
    if (m && req.method === "GET") {
      const s = await pool.query(`SELECT * FROM sessions WHERE id=$1`, [m[1]]);
      if (!s.rows.length) return send(res, 404, { error: "session not found" });
      const st = await pool.query(
        `SELECT name, duration_sec AS secs, cue_audio_url FROM steps WHERE session_id=$1 ORDER BY step_order`, [m[1]]
      );
      return send(res, 200, { ...s.rows[0], steps: st.rows });
    }

    // ---- Phase 3: daily plan ----
    if (path === "/plan/today" && req.method === "GET") {
      const userId = url.searchParams.get("user_id");
      const exclude = url.searchParams.get("exclude");
      let list;
      if (userId) {
        const u = await pool.query(`SELECT * FROM users WHERE id=$1`, [userId]);
        if (!u.rows.length) return send(res, 404, { error: "user not found" });
        const p = u.rows[0];
        const q = await pool.query(
          `SELECT s.id, s.type, s.duration_min FROM sessions s
           WHERE s.goal=$1 AND s.level=$2 AND s.duration_min<=$3
           ${exclude ? `AND s.id<>$4` : ""} ORDER BY s.type, s.id LIMIT 5`,
          exclude ? [p.goal, p.level, p.time_budget_min, exclude] : [p.goal, p.level, p.time_budget_min]
        );
        list = q.rows.length ? q.rows : (await pool.query(`SELECT id,type,duration_min FROM sessions ORDER BY id LIMIT 5`)).rows;
        console.log("analytics: plan_generated", userId);
      } else {
        list = (await pool.query(`SELECT id,type,duration_min FROM sessions ORDER BY id LIMIT 5`)).rows;
      }
      return send(res, 200, { date: new Date().toISOString().slice(0, 10), sessions: list });
    }
    if (path === "/plan/swap" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.user_id || !b.exclude) return send(res, 400, { error: "need user_id + exclude" });
      const u = await pool.query(`SELECT * FROM users WHERE id=$1`, [b.user_id]);
      if (!u.rows.length) return send(res, 404, { error: "user not found" });
      const p = u.rows[0];
      const q = await pool.query(
        `SELECT s.id, s.type, s.duration_min FROM sessions s
         WHERE s.level=$1 AND s.duration_min<=$2 AND s.id<>$3 ORDER BY s.id LIMIT 1`,
        [p.level, p.time_budget_min, b.exclude]
      );
      return q.rows.length ? send(res, 200, q.rows[0]) : send(res, 404, { error: "no swap candidate" });
    }

    // ---- Phase 4: completions ----
    if (path === "/completions" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.user_id || !b.session_id) return send(res, 400, { error: "need user_id + session_id" });
      const { rows } = await pool.query(
        `INSERT INTO completion_logs (user_id, session_id, finished_at, completed_bool)
         VALUES ($1,$2,now(),COALESCE($3,true)) RETURNING *`,
        [b.user_id, b.session_id, b.completed_bool ?? true]
      );
      console.log("analytics: session_completed", b.session_id);
      return send(res, 201, rows[0]);
    }

    // ---- Phase 5: wellness ----
    if (path === "/tips" && req.method === "GET") {
      const cat = url.searchParams.get("category");
      const { rows } = await pool.query(
        cat ? `SELECT * FROM tips WHERE category=$1 ORDER BY id` : `SELECT * FROM tips ORDER BY id`,
        cat ? [cat] : []
      );
      return send(res, 200, rows);
    }
    if (path === "/water" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.user_id) return send(res, 400, { error: "need user_id" });
      const date = b.date || new Date().toISOString().slice(0, 10);
      const { rows } = await pool.query(
        `INSERT INTO wellness_logs (user_id, date, water_ml) VALUES ($1,$2,$3)
         ON CONFLICT (user_id, date) DO UPDATE SET water_ml = wellness_logs.water_ml + EXCLUDED.water_ml
         RETURNING *`,
        [b.user_id, date, Number(b.added_ml) || 250]
      );
      console.log("analytics: water_logged", b.user_id, rows[0].water_ml);
      return send(res, 200, rows[0]);
    }

    // ---- Phase 6: progress ----
    m = path.match(/^\/progress\/([0-9a-f-]{36})$/);
    if (m && req.method === "GET") {
      const days = await pool.query(
        `SELECT COUNT(DISTINCT started_at::date)::int AS active_days,
                COUNT(*)::int AS sessions,
                COUNT(*) FILTER (WHERE completed_bool)::int AS completed
         FROM completion_logs WHERE user_id=$1`, [m[1]]
      );
      const water = await pool.query(
        `SELECT COALESCE(SUM(water_ml),0)::int AS water_ml FROM wellness_logs WHERE user_id=$1`, [m[1]]
      );
      return send(res, 200, { user_id: m[1], streak_days: days.rows[0].active_days, ...days.rows[0], ...water.rows[0] });
    }

    // ---- Phase 7: reminders & notifications (PRD §5.6) ----
    if (path === "/reminders" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.user_id || !["workout", "hydration", "sleep"].includes(b.type))
        return send(res, 400, { error: "need user_id + type(workout|hydration|sleep)" });
      const { rows } = await pool.query(
        `INSERT INTO reminders (user_id, type, time_local, enabled, quiet_from, quiet_to)
         VALUES ($1,$2,$3,COALESCE($4,true),COALESCE($5,'22:00'),COALESCE($6,'06:00'))
         ON CONFLICT (user_id, type) DO UPDATE SET time_local=EXCLUDED.time_local, enabled=EXCLUDED.enabled
         RETURNING *`,
        [b.user_id, b.type, b.time_local || "07:00", b.enabled ?? true, b.quiet_from, b.quiet_to]
      );
      return send(res, 201, rows[0]);
    }
    if (path === "/reminders" && req.method === "GET") {
      const userId = url.searchParams.get("user_id");
      if (!userId) return send(res, 400, { error: "need user_id" });
      const { rows } = await pool.query(`SELECT * FROM reminders WHERE user_id=$1 ORDER BY type`, [userId]);
      return send(res, 200, rows);
    }
    m = path.match(/^\/reminders\/(\d+)$/);
    if (m && req.method === "PATCH") {
      const b = await readBody(req);
      const { rows } = await pool.query(
        `UPDATE reminders SET time_local=COALESCE($1,time_local), enabled=COALESCE($2,enabled) WHERE id=$3 RETURNING *`,
        [b.time_local, b.enabled, Number(m[1])]
      );
      return rows.length ? send(res, 200, rows[0]) : send(res, 404, { error: "reminder not found" });
    }
    if (m && req.method === "DELETE") {
      await pool.query(`DELETE FROM reminders WHERE id=$1`, [Number(m[1])]);
      return send(res, 200, { ok: true });
    }
    // Scheduler poll: reminders due at HH:MM (local), enabled, outside quiet hours.
    if (path === "/reminders/due" && req.method === "GET") {
      const at = url.searchParams.get("at") || "07:00";
      const { rows } = await pool.query(
        `SELECT * FROM reminders WHERE enabled AND time_local=$1
         AND NOT (quiet_from <= $1 AND $1 < quiet_to OR (quiet_from > quiet_to AND ($1 >= quiet_from OR $1 < quiet_to)))`,
        [at]
      );
      return send(res, 200, rows);
    }
    m = path.match(/^\/reminders\/(\d+)\/opened$/);
    if (m && req.method === "POST") {
      const r = await pool.query(`SELECT * FROM reminders WHERE id=$1`, [Number(m[1])]);
      if (!r.rows.length) return send(res, 404, { error: "reminder not found" });
      await pool.query(`INSERT INTO reminder_events (reminder_id, user_id, kind) VALUES ($1,$2,'opened')`,
        [Number(m[1]), r.rows[0].user_id]);
      console.log("analytics: reminder_opened", m[1]);
      // Deep-link target per type: workout→today plan, hydration/sleep→wellness.
      const target = r.rows[0].type === "workout" ? "today" : "well";
      return send(res, 200, { ok: true, deep_link: target });
    }

    return send(res, 404, { error: "not found" });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: String(e.message || e) });
  }
});

// Phase 7 local scheduler: every 60s, fire reminders due at current HH:MM.
// Prod replaces this with FCM/APNs push; logic + quiet-hours stay identical.
setInterval(async () => {
  try {
    const now = new Date();
    const at = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    const { rows } = await pool.query(
      `SELECT * FROM reminders WHERE enabled AND time_local=$1
       AND NOT (quiet_from <= $1 AND $1 < quiet_to OR (quiet_from > quiet_to AND ($1 >= quiet_from OR $1 < quiet_to)))`,
      [at]
    );
    for (const r of rows) {
      await pool.query(`INSERT INTO reminder_events (reminder_id, user_id, kind) VALUES ($1,$2,'sent')`, [r.id, r.user_id]);
      console.log("analytics: reminder_sent", r.type, r.user_id);
    }
  } catch (e) {
    console.error("scheduler:", String(e.message || e));
  }
}, 60000);

server.listen(PORT, () => console.log(`hof-api listening on :${PORT}`));
