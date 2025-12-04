-- Function to safely ensure a subscription exists, bypassing RLS
CREATE OR REPLACE FUNCTION ensure_user_subscription(target_user_id UUID)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if subscription exists
  IF NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = target_user_id) THEN
    -- Insert default free plan
    INSERT INTO public.user_subscriptions (user_id, plan_id, daily_usage, last_reset_date)
    VALUES (target_user_id, 'free', 0, CURRENT_DATE);
  END IF;

  -- Return the subscription
  SELECT row_to_json(us)::jsonb INTO result
  FROM public.user_subscriptions us
  WHERE us.user_id = target_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_subscription TO service_role;
