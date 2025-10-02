-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard 
WITH (security_invoker=on) AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  COALESCE(SUM(CASE WHEN s.session_type = 'work' THEN s.duration_minutes ELSE 0 END), 0) as total_study_minutes,
  COUNT(CASE WHEN s.session_type = 'work' THEN 1 END) as total_sessions
FROM public.profiles p
LEFT JOIN public.study_sessions s ON p.id = s.user_id
GROUP BY p.id, p.username, p.avatar_url
ORDER BY total_study_minutes DESC;