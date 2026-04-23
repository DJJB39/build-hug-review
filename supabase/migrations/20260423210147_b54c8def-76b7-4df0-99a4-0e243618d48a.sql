-- 1. New enum for league discipline
CREATE TYPE public.league_discipline AS ENUM ('gc', 'ac');

-- 2. Add discipline column to leagues, defaulting to 'gc' so existing rows are valid
ALTER TABLE public.leagues
  ADD COLUMN discipline public.league_discipline NOT NULL DEFAULT 'gc';

-- 3. Add ac_handicap column to profiles, mirroring gc_handicap shape
ALTER TABLE public.profiles
  ADD COLUMN ac_handicap smallint NOT NULL DEFAULT 12;

-- 4. Range check matching the form (-3 to 24 like GC)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ac_handicap_range CHECK (ac_handicap >= -3 AND ac_handicap <= 24);