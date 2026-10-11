-- Email support: optional address on users (welcome mail on signup).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
