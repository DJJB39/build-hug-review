-- =========================================================================
-- 1. league_members: prevent self-promotion to admin
-- =========================================================================
DROP POLICY IF EXISTS "User joins league as self" ON public.league_members;
CREATE POLICY "User joins league as self"
  ON public.league_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'player');

-- Auto-add owner as admin when a league is created (so the role-restricted
-- self-insert above doesn't break league creation).
DROP TRIGGER IF EXISTS leagues_add_owner_as_admin ON public.leagues;
CREATE TRIGGER leagues_add_owner_as_admin
  AFTER INSERT ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION public.add_owner_as_admin();

-- =========================================================================
-- 2. profiles: restrict SELECT to self + users sharing a league
-- =========================================================================
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "League peers view profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.league_members me
      JOIN public.league_members them
        ON them.league_id = me.league_id
      WHERE me.user_id = auth.uid()
        AND them.user_id = profiles.id
    )
  );

-- =========================================================================
-- 3. leagues: hide join_code from non-admins via column-level privilege
--    Split the SELECT policy so non-admins can read all columns EXCEPT
--    join_code. Admins/owner keep full read via a separate policy.
-- =========================================================================
-- First, revoke blanket column SELECT and re-grant only the safe columns to
-- authenticated. Admins/owner get join_code via the SECURITY DEFINER helper
-- function below.
REVOKE SELECT ON public.leagues FROM authenticated;
GRANT SELECT (
  id, name, description, format, discipline, target_score,
  handicap_enabled, combined_scoring, max_players, status,
  owner_id, created_at, updated_at
) ON public.leagues TO authenticated;

-- Provide a SECURITY DEFINER function so admins/owner can fetch the join_code.
CREATE OR REPLACE FUNCTION public.get_league_join_code(_league_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.join_code
  FROM public.leagues l
  WHERE l.id = _league_id
    AND (l.owner_id = auth.uid() OR public.is_league_admin(l.id, auth.uid()));
$$;

REVOKE ALL ON FUNCTION public.get_league_join_code(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_league_join_code(uuid) TO authenticated;

-- =========================================================================
-- 4. matches: tighten UPDATE, add explicit DELETE policy
-- =========================================================================
DROP POLICY IF EXISTS "League members update matches" ON public.matches;

CREATE POLICY "Match creator, participants, or admins update matches"
  ON public.matches
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR public.is_league_admin(league_id, auth.uid())
    OR public.is_match_participant(id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = created_by
    OR public.is_league_admin(league_id, auth.uid())
    OR public.is_match_participant(id, auth.uid())
  );

CREATE POLICY "Admins delete matches"
  ON public.matches
  FOR DELETE
  TO authenticated
  USING (public.is_league_admin(league_id, auth.uid()));

-- =========================================================================
-- 5. match_sides + match_side_players: split FOR ALL into per-op policies
-- =========================================================================
-- match_sides
DROP POLICY IF EXISTS "League members manage sides" ON public.match_sides;
DROP POLICY IF EXISTS "League members see sides" ON public.match_sides;

CREATE POLICY "League members see sides"
  ON public.match_sides
  FOR SELECT
  TO authenticated
  USING (public.is_match_visible(match_id, auth.uid()));

CREATE POLICY "Match creator or admins insert sides"
  ON public.match_sides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_sides.match_id
        AND (
          m.created_by = auth.uid()
          OR public.is_league_admin(m.league_id, auth.uid())
        )
    )
  );

CREATE POLICY "Match creator, participants, or admins update sides"
  ON public.match_sides
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_sides.match_id
        AND (
          m.created_by = auth.uid()
          OR public.is_league_admin(m.league_id, auth.uid())
          OR public.is_match_participant(m.id, auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_sides.match_id
        AND (
          m.created_by = auth.uid()
          OR public.is_league_admin(m.league_id, auth.uid())
          OR public.is_match_participant(m.id, auth.uid())
        )
    )
  );

CREATE POLICY "Admins delete sides"
  ON public.match_sides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_sides.match_id
        AND public.is_league_admin(m.league_id, auth.uid())
    )
  );

-- match_side_players
DROP POLICY IF EXISTS "League members manage side players" ON public.match_side_players;
DROP POLICY IF EXISTS "League members see side players" ON public.match_side_players;

CREATE POLICY "League members see side players"
  ON public.match_side_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.match_sides ms
      WHERE ms.id = match_side_players.side_id
        AND public.is_match_visible(ms.match_id, auth.uid())
    )
  );

CREATE POLICY "Match creator or admins insert side players"
  ON public.match_side_players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.match_sides ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.id = match_side_players.side_id
        AND (
          m.created_by = auth.uid()
          OR public.is_league_admin(m.league_id, auth.uid())
        )
    )
  );

CREATE POLICY "Match creator or admins update side players"
  ON public.match_side_players
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.match_sides ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.id = match_side_players.side_id
        AND (
          m.created_by = auth.uid()
          OR public.is_league_admin(m.league_id, auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.match_sides ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.id = match_side_players.side_id
        AND (
          m.created_by = auth.uid()
          OR public.is_league_admin(m.league_id, auth.uid())
        )
    )
  );

CREATE POLICY "Admins delete side players"
  ON public.match_side_players
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.match_sides ms
      JOIN public.matches m ON m.id = ms.match_id
      WHERE ms.id = match_side_players.side_id
        AND public.is_league_admin(m.league_id, auth.uid())
    )
  );