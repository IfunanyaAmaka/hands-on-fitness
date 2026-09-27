-- Hands-On Fitness local schema (matches docs/data-model.md)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal TEXT NOT NULL CHECK (goal IN ('weight_loss','strength','flexibility','stress_relief')),
  level TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  time_budget_min INT NOT NULL CHECK (time_budget_min IN (10,20,30)),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('workout','yoga')),
  goal TEXT NOT NULL,
  level TEXT NOT NULL,
  duration_min INT NOT NULL
);

CREATE TABLE IF NOT EXISTS steps (
  id SERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_sec INT NOT NULL,
  cue_audio_url TEXT,
  step_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_ids TEXT[] NOT NULL,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS completion_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES sessions(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  completed_bool BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('hygiene','water','sleep','nutrition')),
  goal TEXT,
  body TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('daily','post_workout'))
);

CREATE TABLE IF NOT EXISTS wellness_logs (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  water_ml INT NOT NULL DEFAULT 0,
  tips_seen TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, date)
);

-- seed: 1 sample session + 2 tips so Today/Player has something to render
INSERT INTO sessions (id, type, goal, level, duration_min) VALUES
  ('beginner-fullbody-10', 'workout', 'strength', 'beginner', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (session_id, name, duration_sec, step_order) VALUES
  ('beginner-fullbody-10', 'March in place', 60, 1),
  ('beginner-fullbody-10', 'Bodyweight squats', 60, 2),
  ('beginner-fullbody-10', 'Standing yoga stretch', 60, 3)
ON CONFLICT DO NOTHING;

INSERT INTO tips (id, category, body, trigger) VALUES
  ('hydration-post', 'water', 'Drink 250-500ml water within 30 min after your workout.', 'post_workout'),
  ('hygiene-daily', 'hygiene', 'Wipe down + shower after sweating; clean feet to avoid fungal issues.', 'daily')
ON CONFLICT (id) DO NOTHING;
