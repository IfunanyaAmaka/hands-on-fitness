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
const aiTipUsed = {}; // user_id:date → true (daily AI cap; move to DB table in prod)
let spotifyToken = null, spotifyTokenExp = 0; // client-credentials token cache (1h life)

// ---- Payments via Paystack (test mode free; live takes % per transaction). ----
// Setup: paystack.com → Settings → API Keys → TEST secret/public keys.
// Amounts are in KOBO (250000 = ₦2,500). Never trust the browser: the server
// verifies every reference with Paystack before marking success.
const PLANS = { premium_monthly: { amount_kobo: 250000, currency: "NGN" } };
const payConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);
async function paystackVerify(reference) {
  const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const j = await r.json();
  if (!r.ok || !j.status) throw new Error("paystack verify failed: " + JSON.stringify(j).slice(0, 200));
  return j.data;
}

// ---- Email via ZeptoMail (transactional only: welcome, reminders). ----
// Setup: verify a sending domain in ZeptoMail → create a Mail Agent → copy its
// Send Mail Token → ZEPTOMAIL_API_KEY. From-address must use that domain.
// EU accounts: ZEPTOMAIL_BASE=https://api.zeptomail.eu/v1.1/email
const zeptoConfigured = () => Boolean(process.env.ZEPTOMAIL_API_KEY && process.env.ZEPTOMAIL_FROM);
async function zeptoSend(to, subject, htmlbody) {
  const base = process.env.ZEPTOMAIL_BASE || "https://api.zeptomail.com/v1.1/email";
  const r = await fetch(base, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Zoho-enczapikey ${process.env.ZEPTOMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      from: { address: process.env.ZEPTOMAIL_FROM, name: process.env.ZEPTOMAIL_FROM_NAME || "Hands-On Fitness" },
      to: [{ email_address: { address: to } }],
      subject,
      htmlbody,
    }),
  });
  if (!r.ok) throw new Error("zeptomail " + r.status + ": " + (await r.text()).slice(0, 200));
  return r.json();
}
async function sendWelcomeEmail(to, profile) {
  if (!zeptoConfigured()) return { sent: false, reason: "email not configured" };
  const html = `<div style="font-family:sans-serif"><h2>Welcome to Hands-On Fitness 💪</h2><p>Your plan: <b>${profile.goal.replace("_", " ")}</b> · ${profile.level} · ${profile.time_budget_min} min/day.</p><p>Open the app to see today's mix of workout + yoga. Small steps daily beat rare big ones!</p></div>`;
  const out = await zeptoSend(to, "Welcome to Hands-On Fitness 💪", html);
  console.log("analytics: welcome_email_sent", to);
  return { sent: true, out };
}

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
      const email = typeof b.email === "string" && b.email.includes("@") ? b.email.trim() : null;
      const { rows } = await pool.query(
        `INSERT INTO users (goal, level, time_budget_min, email) VALUES ($1,$2,$3,$4) RETURNING *`,
        [b.goal, b.level, Number(b.time_budget_min), email]
      );
      console.log("analytics: onboarding_completed", rows[0].id);
      // Welcome email via ZeptoMail — fire-and-forget, never fails signup.
      if (email) sendWelcomeEmail(email, rows[0]).catch((e) => console.error("welcome email:", String(e.message || e)));
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

    // ---- AI: personal tip via Groq (free tier), DB fallback ----
    // POST /ai/tip {user_id} → {tip, source: ai|fallback}. Max 1 AI call/user/day (in-memory; use a table in prod).
    // Model from GROQ_MODEL (default openai/gpt-oss-20b — Groq retired llama-3.3-70b-versatile on 08/16/26).
    if (path === "/ai/tip" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.user_id) return send(res, 400, { error: "need user_id" });
      const u = await pool.query(`SELECT * FROM users WHERE id=$1`, [b.user_id]);
      if (!u.rows.length) return send(res, 404, { error: "user not found" });
      const p = u.rows[0];
      const today = new Date().toISOString().slice(0, 10);
      const fallback = async () => {
        const t = await pool.query(`SELECT body FROM tips ORDER BY id LIMIT 1`);
        return send(res, 200, { tip: t.rows[0]?.body || "Drink water and rest well today.", source: "fallback" });
      };
      if (!process.env.GROQ_API_KEY) return fallback();
      if (aiTipUsed[`${b.user_id}:${today}`]) return fallback();
      try {
        const recent = await pool.query(
          `SELECT COUNT(*)::int AS n FROM completion_logs WHERE user_id=$1 AND started_at > now() - interval '7 days'`, [b.user_id]
        );
        const prompt = `You are a friendly fitness-app wellness coach. General wellness info only, never medical diagnoses. Write ONE short wellness tip (max 60 words, plain language, beginner-friendly) for a fitness app user. Profile: goal=${p.goal}, level=${p.level}, daily time=${p.time_budget_min} min, sessions last 7 days=${recent.rows[0].n}. Topic: hydration, rest, nutrition, or hygiene — pick what fits best. No preamble, just the tip.`;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 15000);
        const g = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 300,
          }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!g.ok) throw new Error("groq " + g.status);
        const j = await g.json();
        const tip = j.choices?.[0]?.message?.content?.trim();
        if (!tip) throw new Error("empty");
        aiTipUsed[`${b.user_id}:${today}`] = true;
        console.log("analytics: ai_tip_generated", b.user_id);
        return send(res, 200, { tip, source: "ai" });
      } catch (e) {
        console.error("ai tip fallback:", String(e.message || e));
        return fallback();
      }
    }

    // ---- Email test (ZeptoMail). POST /email/test {to} ----
    if (path === "/email/test" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.to || !String(b.to).includes("@")) return send(res, 400, { error: "need to (valid email)" });
      if (!zeptoConfigured()) return send(res, 200, { sent: false, reason: "email not configured — set ZEPTOMAIL_API_KEY + ZEPTOMAIL_FROM" });
      try {
        const out = await zeptoSend(String(b.to).trim(), "Hands-On Fitness test email ✅",
          `<div style="font-family:sans-serif"><h2>It works! 🎉</h2><p>Your Hands-On Fitness app can send email via ZeptoMail.</p></div>`);
        return send(res, 200, { sent: true, out });
      } catch (e) {
        return send(res, 502, { sent: false, error: String(e.message || e) });
      }
    }

    // ---- Payments: init / verify / webhook (Paystack) ----
    // POST /payments/init {user_id, plan} → {reference, amount_kobo, currency, public_key}
    // The app charges with Paystack Inline JS, then calls /payments/verify/:reference.
    if (path === "/payments/init" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.user_id || !PLANS[b.plan || "premium_monthly"])
        return send(res, 400, { error: "need user_id + plan(premium_monthly)" });
      const plan = b.plan || "premium_monthly";
      const reference = `hof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await pool.query(
        `INSERT INTO payments (user_id, reference, plan, amount_kobo, currency) VALUES ($1,$2,$3,$4,$5)`,
        [b.user_id, reference, plan, PLANS[plan].amount_kobo, PLANS[plan].currency]
      );
      return send(res, 201, {
        reference, plan, amount_kobo: PLANS[plan].amount_kobo, currency: PLANS[plan].currency,
        public_key: process.env.PAYSTACK_PUBLIC_KEY || null,
        test_mode: !process.env.PAYSTACK_PUBLIC_KEY || String(process.env.PAYSTACK_PUBLIC_KEY).startsWith("pk_test"),
      });
    }
    m = path.match(/^\/payments\/verify\/([A-Za-z0-9-]+)$/);
    if (m && req.method === "GET") {
      if (!payConfigured()) return send(res, 200, { status: "pending", reason: "payments not configured — set PAYSTACK_SECRET_KEY" });
      const row = await pool.query(`SELECT * FROM payments WHERE reference=$1`, [m[1]]);
      if (!row.rows.length) return send(res, 404, { error: "unknown reference" });
      try {
        const v = await paystackVerify(m[1]);
        const ok = v.status === "success" && v.amount === row.rows[0].amount_kobo;
        await pool.query(`UPDATE payments SET status=$1 WHERE reference=$2`, [ok ? "success" : "failed", m[1]]);
        if (ok) console.log("analytics: payment_success", row.rows[0].user_id, m[1]);
        return send(res, 200, { status: ok ? "success" : "failed", amount_kobo: v.amount, currency: v.currency });
      } catch (e) {
        return send(res, 502, { status: "pending", error: String(e.message || e) });
      }
    }
    // Webhook: Settings → Webhooks → http(s)://your-api/payments/webhook (events: charge.success).
    // Signature checked on the RAW body with HMAC-SHA512 (crypto is Node built-in, no new deps).
    if (path === "/payments/webhook" && req.method === "POST") {
      const raw = await new Promise((resolve) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => resolve(s)); });
      if (!payConfigured()) return send(res, 200, { ok: false, reason: "payments not configured" });
      const { createHmac, timingSafeEqual } = await import("node:crypto");
      const sig = req.headers["x-paystack-signature"] || "";
      const expect = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex");
      const match = sig.length === expect.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
      if (!match) return send(res, 401, { error: "bad signature" });
      let ev = null;
      try { ev = JSON.parse(raw); } catch { return send(res, 400, { error: "bad json" }); }
      if (ev.event === "charge.success") {
        await pool.query(`UPDATE payments SET status='success' WHERE reference=$1`, [ev.data?.reference]);
        console.log("analytics: payment_success_webhook", ev.data?.reference);
      }
      return send(res, 200, { ok: true });
    }

    // ---- Music via Spotify Web API (free). ----
    // Setup: developer.spotify.com → Dashboard → Create app → Client ID + Secret → SPOTIFY_CLIENT_ID/SECRET.
    // Uses Client Credentials flow (app-only: search/browse public playlists+tracks, no user login needed).
    // Full in-app playback needs user Premium + Playback SDK — v1 opens Spotify links/embeds instead.
    // GET /music/search?q=workout&type=playlist&limit=5 ; GET /music/playlist/:id
    const musicConfigured = () => Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
    const spotifyAuth = async () => {
      if (spotifyToken && Date.now() < spotifyTokenExp) return spotifyToken;
      const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
      const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basic}` },
        body: "grant_type=client_credentials",
      });
      if (!r.ok) throw new Error("spotify auth " + r.status);
      const j = await r.json();
      spotifyToken = j.access_token;
      spotifyTokenExp = Date.now() + (j.expires_in - 60) * 1000;
      return spotifyToken;
    };
    const spotifyGet = async (path) => {
      const t = await spotifyAuth();
      const r = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) throw new Error("spotify " + r.status);
      return r.json();
    };
    if (path === "/music/search" && req.method === "GET") {
      if (!musicConfigured()) return send(res, 200, { ok: false, reason: "music not configured — set SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET", items: [] });
      try {
        const q = url.searchParams.get("q") || "workout";
        const type = url.searchParams.get("type") || "playlist";
        const limit = Math.min(10, Number(url.searchParams.get("limit")) || 5);
        const j = await spotifyGet(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`);
        const items = (j.playlists?.items || j.tracks?.items || []).filter(Boolean).map((x) => ({
          id: x.id, name: x.name, url: x.external_urls?.spotify || null,
          image: x.images?.[0]?.url || x.album?.images?.[0]?.url || null,
          owner: x.owner?.display_name || x.artists?.map((a) => a.name).join(", ") || null,
          tracks_total: x.tracks?.total ?? null,
        }));
        return send(res, 200, { ok: true, items });
      } catch (e) {
        return send(res, 502, { ok: false, error: String(e.message || e), items: [] });
      }
    }
    m = path.match(/^\/music\/playlist\/([A-Za-z0-9]+)$/);
    if (m && req.method === "GET") {
      if (!musicConfigured()) return send(res, 200, { ok: false, reason: "music not configured", tracks: [] });
      try {
        const j = await spotifyGet(`/playlists/${m[1]}?fields=name,external_urls,tracks.items(track(name,artists(name),duration_ms,external_urls))&limit=20`);
        const tracks = (j.tracks?.items || []).filter((x) => x.track).map((x) => ({
          name: x.track.name, artists: x.track.artists.map((a) => a.name).join(", "),
          duration_ms: x.track.duration_ms, url: x.track.external_urls?.spotify || null,
        }));
        return send(res, 200, { ok: true, name: j.name, url: j.external_urls?.spotify, tracks });
      } catch (e) {
        return send(res, 502, { ok: false, error: String(e.message || e), tracks: [] });
      }
    }

    // ---- Calendar via Google Calendar API (free). ----
    // Setup: Google Cloud project → enable Calendar API → OAuth consent (External, add your Gmail as test user)
    // → Credentials → OAuth client (Web) → redirect http://localhost:3000/auth/google/callback
    // → GOOGLE_CLIENT_ID/SECRET. Scope is calendar.events only (create events, nothing else).
    // Flow: GET /calendar/auth-url?user_id= → open URL → Google → /auth/google/callback → stored.
    // Then POST /calendar/schedule {user_id, session_id, date, time_local} creates the workout event.
    const calConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const calRedirect = () => process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback";
    const googleToken = async (params) => {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString(),
      });
      if (!r.ok) throw new Error("google oauth " + r.status + ": " + (await r.text()).slice(0, 200));
      return r.json();
    };
    if (path === "/calendar/auth-url" && req.method === "GET") {
      const userId = url.searchParams.get("user_id");
      if (!userId) return send(res, 400, { error: "need user_id" });
      if (!calConfigured()) return send(res, 200, { ok: false, reason: "calendar not configured — set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET", url: null });
      const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      u.search = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: calRedirect(),
        response_type: "code", scope: "https://www.googleapis.com/auth/calendar.events",
        access_type: "offline", prompt: "consent", state: userId,
      }).toString();
      return send(res, 200, { ok: true, url: u.toString() });
    }
    if (path === "/auth/google/callback" && req.method === "GET") {
      const code = url.searchParams.get("code"), userId = url.searchParams.get("state");
      if (!code || !userId) { res.writeHead(400, { "Content-Type": "text/html" }); return res.end("<h2>Missing code — try connecting again.</h2>"); }
      try {
        const t = await googleToken({ code, client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: calRedirect(), grant_type: "authorization_code" });
        await pool.query(
          `INSERT INTO calendar_tokens (user_id, refresh_token) VALUES ($1,$2)
           ON CONFLICT (user_id) DO UPDATE SET refresh_token=EXCLUDED.refresh_token, updated_at=now()`,
          [userId, t.refresh_token || ""]
        );
        console.log("analytics: calendar_connected", userId);
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end("<h2>Calendar connected ✅</h2><p>Go back to Hands-On Fitness and schedule today's session.</p>");
      } catch (e) {
        res.writeHead(502, { "Content-Type": "text/html" });
        return res.end("<h2>Could not connect calendar.</h2><p>" + String(e.message || e) + "</p>");
      }
    }
    if (path === "/calendar/schedule" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.user_id || !b.session_id) return send(res, 400, { error: "need user_id + session_id (+ date, time_local)" });
      if (!calConfigured()) return send(res, 200, { ok: false, reason: "calendar not configured", event: null });
      const tok = await pool.query(`SELECT refresh_token FROM calendar_tokens WHERE user_id=$1`, [b.user_id]);
      if (!tok.rows.length || !tok.rows[0].refresh_token)
        return send(res, 200, { ok: false, reason: "calendar not connected — open the connect link first", event: null });
      try {
        const s = await pool.query(`SELECT * FROM sessions WHERE id=$1`, [b.session_id]);
        const mins = s.rows[0]?.duration_min || 10;
        const date = b.date || new Date().toISOString().slice(0, 10);
        const time = b.time_local || "07:00";
        const at = await googleToken({ client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: tok.rows[0].refresh_token, grant_type: "refresh_token" });
        const start = new Date(`${date}T${time}:00`);
        const end = new Date(start.getTime() + mins * 60000);
        const ev = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: { Authorization: `Bearer ${at.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `💪 Hands-On Fitness: ${b.session_id}`,
            description: "Your guided workout + yoga session. Open the app to start the timer!",
            start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() },
            reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
          }),
        });
        if (!ev.ok) throw new Error("calendar insert " + ev.status);
        const j = await ev.json();
        console.log("analytics: calendar_event_created", b.user_id);
        return send(res, 201, { ok: true, event: { id: j.id, link: j.htmlLink } });
      } catch (e) {
        return send(res, 502, { ok: false, error: String(e.message || e), event: null });
      }
    }

    // ---- Live video rooms via self-hosted LiveKit (post-v1; PRD §7 lists live coaching out of scope). ----
    // POST /live/token {identity, room} → {token, url}. Browser joins with livekit-client.
    // Local dev keys (devkey/secret) match livekit.yaml; override via .env for prod.
    if (path === "/live/token" && req.method === "POST") {
      const b = await readBody(req);
      if (!b || !b.identity || !b.room) return send(res, 400, { error: "need identity + room" });
      try {
        const { AccessToken } = await import("livekit-server-sdk");
        const at = new AccessToken(
          process.env.LIVEKIT_API_KEY || "devkey",
          process.env.LIVEKIT_API_SECRET || "secretdontsharelocalonly",
          { identity: String(b.identity).slice(0, 64), ttl: "2h" }
        );
        at.addGrant({ roomJoin: true, room: String(b.room).slice(0, 64), canPublish: true, canSubscribe: true });
        return send(res, 200, {
          token: await at.toJwt(),
          url: process.env.LIVEKIT_URL || "http://localhost:7880",
        });
      } catch (e) {
        return send(res, 502, { error: String(e.message || e) });
      }
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
