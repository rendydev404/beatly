-- Create plans table
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- Price in IDR
  daily_limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default plans
INSERT INTO plans (id, name, price, daily_limit) VALUES
  ('free', 'Free', 0, 25),
  ('plus', 'Plus', 25000, 50), -- Example price: 25k
  ('pro', 'Pro', 50000, 100); -- Example price: 50k

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  plan_id TEXT REFERENCES plans(id) DEFAULT 'free',
  daily_usage INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id TEXT REFERENCES plans(id) NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  snap_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for plans (Public read-only)
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (true);

-- Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Only service role (server-side) should update subscriptions usually, but for now we might need to allow some updates or handle it via secure RPC/API. 
-- For simplicity in this demo, we'll assume server-side updates via service role or secure functions. 
-- But to allow the client to read:
CREATE POLICY "Users can read own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user creation (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_id, daily_usage, last_reset_date)
  VALUES (new.id, 'free', 0, CURRENT_DATE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
