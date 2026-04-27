-- =============================================
-- BISQUE DEMO SEED DATA
-- Run after migrations. Creates data that matches current app functionality:
--   - 8 realistic UK croquet demo players
--   - 1 active GC Singles Handicap League
--   - 12 completed/confirmed singles matches
--   - match sides, side players, confirmation rows, and handicap event history
--
-- Notes:
--   - This seed intentionally uses the first existing authenticated user as the
--     demo league owner/creator. Sign up at least one user before running it.
--   - Demo players are represented as profile/member rows so the existing league,
--     member, match, score, confirmation, and handicap-event screens feel alive.
--   - It does not add any new app features.
-- =============================================

DO $$
DECLARE
  v_owner UUID;
  v_league UUID;
  v_match UUID;
  v_side1 UUID;
  v_side2 UUID;
  v_player1 UUID;
  v_player2 UUID;
  v_side1_score SMALLINT;
  v_side2_score SMALLINT;
  v_winner SMALLINT;
  v_delta INT;
  v_played_at TIMESTAMPTZ;
BEGIN
  SELECT id INTO v_owner FROM auth.users ORDER BY created_at LIMIT 1;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Bisque seed needs at least one signed-up user. Create an account, then rerun supabase/seed.sql.';
  END IF;

  DELETE FROM public.handicap_events
  WHERE notes LIKE 'Demo seed:%';

  DELETE FROM public.match_confirmations
  WHERE match_id IN (
    SELECT id FROM public.matches
    WHERE league_id IN (SELECT id FROM public.leagues WHERE join_code = 'WATFRD26')
  );

  DELETE FROM public.match_side_players
  WHERE side_id IN (
    SELECT ms.id
    FROM public.match_sides ms
    JOIN public.matches m ON m.id = ms.match_id
    JOIN public.leagues l ON l.id = m.league_id
    WHERE l.join_code = 'WATFRD26'
  );

  DELETE FROM public.match_sides
  WHERE match_id IN (
    SELECT m.id
    FROM public.matches m
    JOIN public.leagues l ON l.id = m.league_id
    WHERE l.join_code = 'WATFRD26'
  );

  DELETE FROM public.matches
  WHERE league_id IN (SELECT id FROM public.leagues WHERE join_code = 'WATFRD26');

  DELETE FROM public.league_members
  WHERE league_id IN (SELECT id FROM public.leagues WHERE join_code = 'WATFRD26');

  DELETE FROM public.leagues WHERE join_code = 'WATFRD26';

  DELETE FROM public.profiles
  WHERE id IN (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666',
    '77777777-7777-4777-8777-777777777777',
    '88888888-8888-4888-8888-888888888888'
  );

  INSERT INTO public.profiles (id, display_name, club, gc_handicap, ac_handicap, gc_index, handicap_source, onboarded_at)
  VALUES
    ('11111111-1111-4111-8111-111111111111', 'Margaret Hughes', 'Watford CC', 8, 10, 1320, 'club', now()),
    ('22222222-2222-4222-8222-222222222222', 'Henry Thompson', 'Sussex County', 12, 14, 1180, 'system', now()),
    ('33333333-3333-4333-8333-333333333333', 'David Patel', 'Phyllis Court', 5, 7, 1480, 'club', now()),
    ('44444444-4444-4444-8444-444444444444', 'Sarah O''Connor', 'Colchester', 15, 17, 1050, 'self', now()),
    ('55555555-5555-4555-8555-555555555555', 'James Whitaker', 'Wrest Park', 9, 11, 1280, 'club', now()),
    ('66666666-6666-4666-8666-666666666666', 'Emma Leclerc', 'East Anglian', 11, 13, 1210, 'system', now()),
    ('77777777-7777-4777-8777-777777777777', 'Robert "Bob" McKenzie', 'Watford CC', 18, 20, 980, 'self', now()),
    ('88888888-8888-4888-8888-888888888888', 'Priya Sharma', 'Southern Fed', 7, 9, 1390, 'club', now())
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    club = EXCLUDED.club,
    gc_handicap = EXCLUDED.gc_handicap,
    ac_handicap = EXCLUDED.ac_handicap,
    gc_index = EXCLUDED.gc_index,
    handicap_source = EXCLUDED.handicap_source,
    onboarded_at = EXCLUDED.onboarded_at;

  INSERT INTO public.leagues (
    name,
    description,
    format,
    discipline,
    target_score,
    handicap_enabled,
    combined_scoring,
    max_players,
    owner_id,
    join_code,
    status
  ) VALUES (
    'Watford Spring Handicap Singles 2026',
    'Internal club ladder plus occasional visitors. First to 7, full handicap.',
    'singles',
    'gc',
    7,
    true,
    true,
    12,
    v_owner,
    'WATFRD26',
    'active'
  )
  RETURNING id INTO v_league;

  INSERT INTO public.league_members (league_id, user_id, role)
  VALUES (v_league, v_owner, 'admin')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.league_members (league_id, user_id, role)
  SELECT v_league, id, 'player'
  FROM public.profiles
  WHERE id IN (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666',
    '77777777-7777-4777-8777-777777777777',
    '88888888-8888-4888-8888-888888888888'
  );

  FOR v_player1, v_player2, v_side1_score, v_side2_score, v_winner, v_delta, v_played_at IN
    SELECT * FROM (VALUES
      ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 7::smallint, 4::smallint, 1::smallint, 15, now() - interval '31 days'),
      ('33333333-3333-4333-8333-333333333333'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 6::smallint, 7::smallint, 2::smallint, 24, now() - interval '28 days'),
      ('55555555-5555-4555-8555-555555555555'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 7::smallint, 5::smallint, 1::smallint, 12, now() - interval '26 days'),
      ('88888888-8888-4888-8888-888888888888'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 7::smallint, 3::smallint, 1::smallint, 10, now() - interval '23 days'),
      ('22222222-2222-4222-8222-222222222222'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 7::smallint, 6::smallint, 1::smallint, 18, now() - interval '21 days'),
      ('11111111-1111-4111-8111-111111111111'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 5::smallint, 7::smallint, 2::smallint, 14, now() - interval '18 days'),
      ('66666666-6666-4666-8666-666666666666'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 7::smallint, 2::smallint, 1::smallint, 11, now() - interval '16 days'),
      ('55555555-5555-4555-8555-555555555555'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 4::smallint, 7::smallint, 2::smallint, 16, now() - interval '13 days'),
      ('44444444-4444-4444-8444-444444444444'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 7::smallint, 5::smallint, 1::smallint, 13, now() - interval '10 days'),
      ('22222222-2222-4222-8222-222222222222'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 3::smallint, 7::smallint, 2::smallint, 20, now() - interval '7 days'),
      ('33333333-3333-4333-8333-333333333333'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 7::smallint, 6::smallint, 1::smallint, 22, now() - interval '4 days'),
      ('11111111-1111-4111-8111-111111111111'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, 6::smallint, 7::smallint, 2::smallint, 17, now() - interval '1 day')
    ) AS fixtures(player1, player2, side1_score, side2_score, winner_side, index_delta, played_at)
  LOOP
    INSERT INTO public.matches (
      league_id,
      match_type,
      target_score,
      status,
      scheduled_for,
      started_at,
      ended_at,
      winner_side,
      handicap_applied,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      v_league,
      'singles',
      7,
      'confirmed',
      v_played_at - interval '2 hours',
      v_played_at - interval '90 minutes',
      v_played_at,
      v_winner,
      true,
      v_owner,
      v_played_at - interval '2 hours',
      v_played_at
    )
    RETURNING id INTO v_match;

    INSERT INTO public.match_sides (match_id, side_number, score, extra_strokes_received, extra_strokes_used)
    VALUES
      (v_match, 1, v_side1_score, GREATEST(0, (SELECT gc_handicap FROM public.profiles WHERE id = v_player1) - (SELECT gc_handicap FROM public.profiles WHERE id = v_player2)), LEAST(3, GREATEST(0, (SELECT gc_handicap FROM public.profiles WHERE id = v_player1) - (SELECT gc_handicap FROM public.profiles WHERE id = v_player2)))),
      (v_match, 2, v_side2_score, GREATEST(0, (SELECT gc_handicap FROM public.profiles WHERE id = v_player2) - (SELECT gc_handicap FROM public.profiles WHERE id = v_player1)), LEAST(3, GREATEST(0, (SELECT gc_handicap FROM public.profiles WHERE id = v_player2) - (SELECT gc_handicap FROM public.profiles WHERE id = v_player1))))
    RETURNING id INTO v_side2;

    SELECT id INTO v_side1 FROM public.match_sides WHERE match_id = v_match AND side_number = 1;
    SELECT id INTO v_side2 FROM public.match_sides WHERE match_id = v_match AND side_number = 2;

    INSERT INTO public.match_side_players (side_id, user_id, handicap_snapshot, index_snapshot, ball_colour)
    SELECT v_side1, id, gc_handicap, gc_index, 'clay' FROM public.profiles WHERE id = v_player1
    UNION ALL
    SELECT v_side2, id, gc_handicap, gc_index, 'ochre' FROM public.profiles WHERE id = v_player2;

    INSERT INTO public.match_confirmations (match_id, user_id, state, responded_at, created_at, note)
    VALUES
      (v_match, v_player1, 'confirmed', v_played_at + interval '5 minutes', v_played_at, NULL),
      (v_match, v_player2, 'confirmed', v_played_at + interval '8 minutes', v_played_at, NULL);

    INSERT INTO public.handicap_events (user_id, match_id, reason, index_before, index_after, index_delta, handicap_before, handicap_after, notes, created_at)
    SELECT
      p.id,
      v_match,
      'match',
      p.gc_index,
      CASE
        WHEN (p.id = v_player1 AND v_winner = 1) OR (p.id = v_player2 AND v_winner = 2) THEN p.gc_index + v_delta
        ELSE p.gc_index - v_delta
      END,
      CASE
        WHEN (p.id = v_player1 AND v_winner = 1) OR (p.id = v_player2 AND v_winner = 2) THEN v_delta
        ELSE -v_delta
      END,
      p.gc_handicap,
      p.gc_handicap,
      'Demo seed: confirmed singles result',
      v_played_at
    FROM public.profiles p
    WHERE p.id IN (v_player1, v_player2);
  END LOOP;
END $$;
