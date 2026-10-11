-- Payments: one row per Paystack transaction (test mode free, no setup fee).
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'premium_monthly',
  amount_kobo INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);
