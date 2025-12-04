-- Allow users to update their own subscription usage (needed for the API to work with user token)
-- Ideally this should be a stored procedure called by a service role, but for this setup:
CREATE POLICY "Users can update own subscription usage" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
