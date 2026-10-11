-- Calendar: per-user Google OAuth refresh tokens (offline access, calendar.events scope only).
CREATE TABLE IF NOT EXISTS calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
