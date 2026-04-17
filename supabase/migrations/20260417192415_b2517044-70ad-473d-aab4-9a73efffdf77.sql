-- =====================================================================
-- Bisque core schema
-- =====================================================================

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- Roles
-- =====================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =====================================================================
-- Profiles
-- =====================================================================
CREATE TYPE public.handicap_source AS ENUM ('self', 'club', 'system');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  club TEXT,
  avatar_url TEXT,
  gc_handicap SMALLINT NOT NULL DEFAULT 12 CHECK (gc_handicap BETWEEN -3 AND 24),
  gc_index INTEGER NOT NULL DEFAULT 1200,
  handicap_source public.handicap_source NOT NULL DEFAULT 'self',
  manual_override_at TIMESTAMPTZ,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- Leagues
-- =====================================================================
CREATE TYPE public.league_format AS ENUM ('singles', 'doubles', 'mixed');
CREATE TYPE public.league_status AS ENUM ('active', 'archived');
CREATE TYPE public.member_role  AS ENUM ('admin', 'player');

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  format public.league_format NOT NULL DEFAULT 'singles',
  target_score SMALLINT NOT NULL DEFAULT 7 CHECK (target_score BETWEEN 1 AND 26),
  handicap_enabled BOOLEAN NOT NULL DEFAULT true,
  combined_scoring BOOLEAN NOT NULL DEFAULT true,
  max_players SMALLINT,
  status public.league_status NOT NULL DEFAULT 'active',
  join_code TEXT NOT NULL UNIQUE DEFAULT public.generate_join_code(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER leagues_set_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- League members
-- =====================================================================
CREATE TABLE public.league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'player',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);

ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

-- Security-definer membership helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_league_member(_league_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = _league_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_league_admin(_league_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = _league_id AND user_id = _user_id AND role = 'admin'
  );
$$;

-- League policies
CREATE POLICY "Members view leagues" ON public.leagues
  FOR SELECT TO authenticated
  USING (public.is_league_member(id, auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Authenticated create leagues" ON public.leagues
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins update leagues" ON public.leagues
  FOR UPDATE TO authenticated
  USING (public.is_league_admin(id, auth.uid()) OR owner_id = auth.uid())
  WITH CHECK (public.is_league_admin(id, auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Owner deletes league" ON public.leagues
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- League member policies
CREATE POLICY "Members view membership rows" ON public.league_members
  FOR SELECT TO authenticated
  USING (public.is_league_member(league_id, auth.uid()));

CREATE POLICY "User joins league as self" ON public.league_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage members" ON public.league_members
  FOR DELETE TO authenticated
  USING (public.is_league_admin(league_id, auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins update members" ON public.league_members
  FOR UPDATE TO authenticated
  USING (public.is_league_admin(league_id, auth.uid()))
  WITH CHECK (public.is_league_admin(league_id, auth.uid()));

-- Auto-add owner as admin member
CREATE OR REPLACE FUNCTION public.add_owner_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.league_members (league_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER leagues_add_owner_admin
  AFTER INSERT ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_admin();

-- =====================================================================
-- Matches
-- =====================================================================
CREATE TYPE public.match_type AS ENUM ('singles', 'doubles');
CREATE TYPE public.match_status AS ENUM ('scheduled', 'live', 'awaiting_confirmation', 'confirmed', 'disputed', 'cancelled');
CREATE TYPE public.ball_colour AS ENUM ('clay', 'ochre', 'navy', 'charcoal');

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  match_type public.match_type NOT NULL DEFAULT 'singles',
  target_score SMALLINT NOT NULL DEFAULT 7,
  status public.match_status NOT NULL DEFAULT 'scheduled',
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_side SMALLINT CHECK (winner_side IN (1,2)),
  handicap_applied BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER matches_set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_matches_league ON public.matches(league_id);

-- =====================================================================
-- Match sides + side players
-- =====================================================================
CREATE TABLE public.match_sides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  side_number SMALLINT NOT NULL CHECK (side_number IN (1,2)),
  score SMALLINT NOT NULL DEFAULT 0,
  extra_strokes_received SMALLINT NOT NULL DEFAULT 0,
  extra_strokes_used SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (match_id, side_number)
);

ALTER TABLE public.match_sides ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.match_side_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  side_id UUID NOT NULL REFERENCES public.match_sides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  handicap_snapshot SMALLINT NOT NULL,
  index_snapshot INTEGER NOT NULL,
  ball_colour public.ball_colour NOT NULL DEFAULT 'clay',
  UNIQUE (side_id, user_id)
);

ALTER TABLE public.match_side_players ENABLE ROW LEVEL SECURITY;

-- Match membership helpers
CREATE OR REPLACE FUNCTION public.is_match_visible(_match_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = _match_id
      AND public.is_league_member(m.league_id, _user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_match_participant(_match_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.match_side_players msp
    JOIN public.match_sides ms ON ms.id = msp.side_id
    WHERE ms.match_id = _match_id AND msp.user_id = _user_id
  );
$$;

CREATE POLICY "League members see matches" ON public.matches
  FOR SELECT TO authenticated
  USING (public.is_league_member(league_id, auth.uid()));

CREATE POLICY "League members create matches" ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK (public.is_league_member(league_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "League members update matches" ON public.matches
  FOR UPDATE TO authenticated
  USING (public.is_league_member(league_id, auth.uid()))
  WITH CHECK (public.is_league_member(league_id, auth.uid()));

CREATE POLICY "League members see sides" ON public.match_sides
  FOR SELECT TO authenticated USING (public.is_match_visible(match_id, auth.uid()));

CREATE POLICY "League members manage sides" ON public.match_sides
  FOR ALL TO authenticated
  USING (public.is_match_visible(match_id, auth.uid()))
  WITH CHECK (public.is_match_visible(match_id, auth.uid()));

CREATE POLICY "League members see side players" ON public.match_side_players
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.match_sides ms
    WHERE ms.id = side_id AND public.is_match_visible(ms.match_id, auth.uid())
  ));

CREATE POLICY "League members manage side players" ON public.match_side_players
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.match_sides ms
    WHERE ms.id = side_id AND public.is_match_visible(ms.match_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.match_sides ms
    WHERE ms.id = side_id AND public.is_match_visible(ms.match_id, auth.uid())
  ));

-- =====================================================================
-- Confirmations
-- =====================================================================
CREATE TYPE public.confirmation_state AS ENUM ('pending', 'confirmed', 'disputed');

CREATE TABLE public.match_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state public.confirmation_state NOT NULL DEFAULT 'pending',
  note TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

ALTER TABLE public.match_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible to match participants" ON public.match_confirmations
  FOR SELECT TO authenticated USING (public.is_match_visible(match_id, auth.uid()));

CREATE POLICY "Participants insert own confirmation" ON public.match_confirmations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_match_participant(match_id, auth.uid()));

CREATE POLICY "Participants update own confirmation" ON public.match_confirmations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- Handicap events (append-only history)
-- =====================================================================
CREATE TYPE public.handicap_reason AS ENUM ('match', 'manual', 'club_override', 'initial');

CREATE TABLE public.handicap_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  reason public.handicap_reason NOT NULL,
  index_before INTEGER NOT NULL,
  index_after INTEGER NOT NULL,
  index_delta INTEGER NOT NULL,
  handicap_before SMALLINT NOT NULL,
  handicap_after SMALLINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.handicap_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_handicap_events_user ON public.handicap_events(user_id, created_at DESC);

CREATE POLICY "Users view own handicap events" ON public.handicap_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- League members can see other members' index history (for trends)
CREATE POLICY "League members view shared handicap events" ON public.handicap_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.league_members me
    WHERE me.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.league_members them
        WHERE them.user_id = handicap_events.user_id
          AND them.league_id = me.league_id
      )
  ));
