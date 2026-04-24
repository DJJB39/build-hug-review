CREATE OR REPLACE FUNCTION public.find_league_by_join_code(_join_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id, l.name
  FROM public.leagues l
  WHERE l.join_code = upper(trim(_join_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_league_by_join_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_league_by_join_code(text) TO authenticated;