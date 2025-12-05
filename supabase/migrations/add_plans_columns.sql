-- Migration: Add new columns to plans table for admin management
-- Run this in Supabase SQL Editor

-- Add features column (array of text)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY['Basic Feature']::TEXT[];

-- Add duration columns
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(10) DEFAULT 'month';

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS duration_value INTEGER DEFAULT 1;

-- Add is_popular column
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Update existing plans with default features if needed
UPDATE plans SET features = ARRAY['25 Songs/Day', 'Ads Support', 'Standard Quality'] WHERE id = 'free' AND features IS NULL;
UPDATE plans SET features = ARRAY['50 Songs/Day', 'No Ads', 'High Quality Audio', 'Priority Support'], is_popular = true WHERE id = 'plus' AND features IS NULL;
UPDATE plans SET features = ARRAY['100 Songs/Day', 'No Ads', 'Ultra HD Quality', 'Offline Mode', 'Exclusive Content'] WHERE id = 'pro' AND features IS NULL;

-- Make sure all plans have duration defaults
UPDATE plans SET duration_type = 'month', duration_value = 1 WHERE duration_type IS NULL;
UPDATE plans SET duration_type = 'month', duration_value = 1 WHERE id IN ('plus', 'pro');

-- Set free plan to have unlimited duration (conceptually)
UPDATE plans SET duration_type = 'year', duration_value = 100 WHERE id = 'free';

-- Grant permissions for service role to update plans
-- (This should already be allowed with service role key)
