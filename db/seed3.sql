-- Phase 7: reminders + delivery events (PRD §5.6)
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('workout','hydration','sleep')),
  time_local TEXT NOT NULL DEFAULT '07:00',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_from TEXT NOT NULL DEFAULT '22:00',
  quiet_to TEXT NOT NULL DEFAULT '06:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, type)
);

CREATE TABLE IF NOT EXISTS reminder_events (
  id SERIAL PRIMARY KEY,
  reminder_id INT REFERENCES reminders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('sent','opened')),
  created_at TIMESTAMPTZ DEFAULT now()
);
