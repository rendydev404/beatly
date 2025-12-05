-- =============================================
-- Listening History Schema for User Profile Feature
-- Run this in Supabase SQL Editor
-- =============================================

-- Create listening_history table
CREATE TABLE IF NOT EXISTS listening_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  album_image TEXT,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON listening_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_played ON listening_history(user_id, played_at DESC);

-- Enable Row Level Security
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own history
CREATE POLICY "Users can view own history" 
  ON listening_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own history" 
  ON listening_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow service role to manage all history (for admin purposes)
CREATE POLICY "Service role can manage all history"
  ON listening_history
  FOR ALL
  USING (auth.role() = 'service_role');
