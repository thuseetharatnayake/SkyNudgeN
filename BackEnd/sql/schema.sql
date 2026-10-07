-- SkyNudge Supabase schema.
-- Run by database.py using the postgres database role. Client access is governed
-- by Row Level Security and the SECURITY DEFINER RPC functions below.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$
BEGIN
  CREATE TYPE public.sky_category AS ENUM ('sunset', 'sunrise', 'rainbow', 'clouds', 'moon', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE public.nudge_intensity AS ENUM ('beautiful', 'wow', 'look_now');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE public.nudge_direction AS ENUM ('west', 'east', 'north', 'south', 'above');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE public.verification_status AS ENUM ('not_verified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  verification_status public.verification_status NOT NULL DEFAULT 'not_verified',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_legal_name text,
  phone_number text,
  consent_given boolean NOT NULL,
  consent_at timestamptz,
  status public.verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT verification_requests_pending_status CHECK (status IN ('pending', 'verified', 'rejected'))
);

CREATE TABLE IF NOT EXISTS public.nudges (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.sky_category NOT NULL,
  intensity public.nudge_intensity NOT NULL,
  direction public.nudge_direction NOT NULL,
  radius_km integer NOT NULL CHECK (radius_km IN (2, 5, 10)),
  landmark text,
  note text,
  photo_path text,
  approx_location extensions.geography(Point, 4326) NOT NULL,
  share_exact boolean NOT NULL DEFAULT false,
  exact_location extensions.geography(Point, 4326),
  area_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  CONSTRAINT nudges_note_length CHECK (note IS NULL OR char_length(note) <= 500),
  CONSTRAINT nudges_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS public.nudge_sightings (
  nudge_id uuid NOT NULL REFERENCES public.nudges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (nudge_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.nudge_pings (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  nudge_id uuid NOT NULL REFERENCES public.nudges(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sky_moments (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_id uuid REFERENCES public.nudges(id) ON DELETE SET NULL,
  category public.sky_category NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  location_label text,
  direction public.nudge_direction,
  landmark text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sky_moments_note_length CHECK (note IS NULL OR char_length(note) <= 2000)
);

CREATE TABLE IF NOT EXISTS public.sky_moment_photos (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  moment_id uuid NOT NULL REFERENCES public.sky_moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (moment_id, position)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_id uuid NOT NULL REFERENCES public.nudges(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_not_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS nudges_active_location_idx ON public.nudges USING gist (approx_location);
CREATE INDEX IF NOT EXISTS nudges_active_idx ON public.nudges (expires_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS nudge_sightings_nudge_idx ON public.nudge_sightings (nudge_id);
CREATE INDEX IF NOT EXISTS nudge_pings_created_idx ON public.nudge_pings (created_at);
CREATE INDEX IF NOT EXISTS verification_requests_user_idx ON public.verification_requests (user_id, created_at DESC);

-- ============================================================================
-- USERNAME AND PRIVACY FUNCTIONS / TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_username()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
  adjectives text[] := ARRAY['Cloud', 'Golden', 'Peach', 'Misty', 'Quiet', 'Lunar', 'Harbour', 'Amber', 'Silver', 'Velvet', 'Sunny', 'Hazy'];
  nouns text[] := ARRAY['Drifter', 'Cloud', 'Sky', 'Horizon', 'Arc', 'Glow', 'Watcher', 'Seeker', 'Breeze', 'Ray', 'Nimbus', 'Sailor'];
BEGIN
  RETURN adjectives[1 + floor(random() * array_length(adjectives, 1))::integer]
    || nouns[1 + floor(random() * array_length(nouns, 1))::integer]
    || (100 + floor(random() * 900)::integer)::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  candidate_username text;
BEGIN
  LOOP
    candidate_username := public.generate_username();
    BEGIN
      INSERT INTO public.profiles (id, username) VALUES (NEW.id, candidate_username);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- A username collision is harmless; choose another anonymous name.
      NULL;
    END;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.enforce_nudge_privacy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- 0.01 degrees is approximately one kilometre. The client never controls
  -- the stored precise coordinate unless it explicitly opts in.
  NEW.approx_location := extensions.ST_SnapToGrid(NEW.approx_location::extensions.geometry, 0.01, 0.01)::extensions.geography;
  IF NOT NEW.share_exact THEN
    NEW.exact_location := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_nudge_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT count(*) FROM public.nudges WHERE user_id = NEW.user_id AND created_at >= now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'You can create a maximum of 5 nudges per hour.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_nudge_ping()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.nudge_pings (nudge_id) VALUES (NEW.nudge_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_nudge_ping_from_nudge()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.nudge_pings (nudge_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nudges_privacy_before_insert ON public.nudges;
CREATE TRIGGER nudges_privacy_before_insert
  BEFORE INSERT ON public.nudges
  FOR EACH ROW EXECUTE FUNCTION public.enforce_nudge_privacy();
DROP TRIGGER IF EXISTS nudges_rate_limit_before_insert ON public.nudges;
CREATE TRIGGER nudges_rate_limit_before_insert
  BEFORE INSERT ON public.nudges
  FOR EACH ROW EXECUTE FUNCTION public.enforce_nudge_rate_limit();
DROP TRIGGER IF EXISTS nudges_ping_after_insert ON public.nudges;
CREATE TRIGGER nudges_ping_after_insert
  AFTER INSERT ON public.nudges
  FOR EACH ROW EXECUTE FUNCTION public.create_nudge_ping_from_nudge();
DROP TRIGGER IF EXISTS nudge_sightings_ping_after_insert ON public.nudge_sightings;
CREATE TRIGGER nudge_sightings_ping_after_insert
  AFTER INSERT ON public.nudge_sightings
  FOR EACH ROW EXECUTE FUNCTION public.create_nudge_ping();

-- ============================================================================
-- ROW LEVEL SECURITY AND TABLE PRIVILEGES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sky_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sky_moment_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.nudges, public.nudge_sightings, public.nudge_pings, public.reports TO authenticated;
GRANT INSERT ON public.reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sky_moments, public.sky_moment_photos, public.user_blocks TO authenticated;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
-- Profiles intentionally have no client UPDATE privilege: username and
-- verification_status are protected, and there are no other mutable fields.

DROP POLICY IF EXISTS verification_requests_no_client_access ON public.verification_requests;
CREATE POLICY verification_requests_no_client_access ON public.verification_requests FOR ALL TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS nudges_select_own ON public.nudges;
CREATE POLICY nudges_select_own ON public.nudges FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS sightings_select_own ON public.nudge_sightings;
CREATE POLICY sightings_select_own ON public.nudge_sightings FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS pings_select_authenticated ON public.nudge_pings;
CREATE POLICY pings_select_authenticated ON public.nudge_pings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS moments_owner_all ON public.sky_moments;
CREATE POLICY moments_owner_all ON public.sky_moments FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS moment_photos_owner_all ON public.sky_moment_photos;
CREATE POLICY moment_photos_owner_all ON public.sky_moment_photos FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.sky_moments moment WHERE moment.id = moment_id AND moment.user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.sky_moments moment WHERE moment.id = moment_id AND moment.user_id = auth.uid())
  );

DROP POLICY IF EXISTS reports_select_own ON public.reports;
CREATE POLICY reports_select_own ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
DROP POLICY IF EXISTS reports_insert_own ON public.reports;
CREATE POLICY reports_insert_own ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS blocks_owner_all ON public.user_blocks;
CREATE POLICY blocks_owner_all ON public.user_blocks FOR ALL TO authenticated
  USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

-- ============================================================================
-- CLIENT RPC FUNCTIONS (SECURITY DEFINER)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_nudge(
  p_category public.sky_category,
  p_intensity public.nudge_intensity,
  p_direction public.nudge_direction,
  p_radius_km integer,
  p_landmark text,
  p_note text,
  p_photo_path text,
  p_lat double precision,
  p_lng double precision,
  p_share_exact boolean DEFAULT false,
  p_area_label text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  created_nudge_id uuid;
  submitted_location extensions.geography;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  IF p_radius_km NOT IN (2, 5, 10) THEN RAISE EXCEPTION 'radius_km must be 2, 5, or 10.'; END IF;
  IF p_lat NOT BETWEEN -90 AND 90 OR p_lng NOT BETWEEN -180 AND 180 THEN RAISE EXCEPTION 'Invalid latitude or longitude.'; END IF;
  IF p_note IS NOT NULL AND char_length(p_note) > 500 THEN RAISE EXCEPTION 'Nudge note must be 500 characters or fewer.'; END IF;
  submitted_location := extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography;
  INSERT INTO public.nudges (user_id, category, intensity, direction, radius_km, landmark, note, photo_path, approx_location, share_exact, exact_location, area_label)
  VALUES (auth.uid(), p_category, p_intensity, p_direction, p_radius_km, nullif(trim(p_landmark), ''), nullif(trim(p_note), ''), nullif(trim(p_photo_path), ''), submitted_location, coalesce(p_share_exact, false), submitted_location, nullif(trim(p_area_label), ''))
  RETURNING id INTO created_nudge_id;
  RETURN created_nudge_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_nearby_nudges(double precision, double precision);
CREATE FUNCTION public.get_nearby_nudges(p_user_lat double precision, p_user_lng double precision)
RETURNS TABLE (
  id uuid, category public.sky_category, intensity public.nudge_intensity, direction public.nudge_direction,
  radius_km integer, landmark text, note text, photo_path text, area_label text, created_at timestamptz,
  expires_at timestamptz, minutes_left integer, distance_km numeric, poster_id uuid, poster_username text,
  poster_is_verified boolean, seen_count bigint, i_saw_it boolean, latitude double precision,
  longitude double precision, location_is_exact boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH caller AS (
    SELECT extensions.ST_SetSRID(extensions.ST_MakePoint(p_user_lng, p_user_lat), 4326)::extensions.geography AS location
  )
  SELECT n.id, n.category, n.intensity, n.direction, n.radius_km, n.landmark, n.note, n.photo_path, n.area_label,
         n.created_at, n.expires_at,
         greatest(0, ceil(extract(epoch FROM (n.expires_at - now())) / 60)::integer),
         round((extensions.ST_Distance(n.approx_location, caller.location) / 1000.0) * 2) / 2,
         n.user_id, profile.username, (profile.verification_status = 'verified'),
         (SELECT count(*) FROM public.nudge_sightings sighting WHERE sighting.nudge_id = n.id),
         EXISTS (SELECT 1 FROM public.nudge_sightings mine WHERE mine.nudge_id = n.id AND mine.user_id = auth.uid()),
         extensions.ST_Y((CASE WHEN n.share_exact THEN n.exact_location ELSE n.approx_location END)::extensions.geometry),
         extensions.ST_X((CASE WHEN n.share_exact THEN n.exact_location ELSE n.approx_location END)::extensions.geometry),
         n.share_exact
  FROM public.nudges n
  JOIN public.profiles profile ON profile.id = n.user_id
  CROSS JOIN caller
  WHERE auth.uid() IS NOT NULL
    AND p_user_lat BETWEEN -90 AND 90 AND p_user_lng BETWEEN -180 AND 180
    AND n.expires_at > now()
    AND extensions.ST_DWithin(n.approx_location, caller.location, n.radius_km * 1000.0)
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks block WHERE block.blocker_id = auth.uid() AND block.blocked_id = n.user_id)
  ORDER BY n.created_at DESC;
$$;

DROP FUNCTION IF EXISTS public.get_nudge(uuid);
CREATE FUNCTION public.get_nudge(p_nudge_id uuid)
RETURNS TABLE (
  id uuid, category public.sky_category, intensity public.nudge_intensity, direction public.nudge_direction,
  radius_km integer, landmark text, note text, photo_path text, area_label text, created_at timestamptz,
  expires_at timestamptz, minutes_left integer, distance_km numeric, poster_id uuid, poster_username text,
  poster_is_verified boolean, seen_count bigint, i_saw_it boolean, latitude double precision,
  longitude double precision, location_is_exact boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT n.id, n.category, n.intensity, n.direction, n.radius_km, n.landmark, n.note, n.photo_path, n.area_label,
         n.created_at, n.expires_at,
         greatest(0, ceil(extract(epoch FROM (n.expires_at - now())) / 60)::integer),
         NULL::numeric,
         n.user_id, profile.username, (profile.verification_status = 'verified'),
         (SELECT count(*) FROM public.nudge_sightings sighting WHERE sighting.nudge_id = n.id),
         EXISTS (SELECT 1 FROM public.nudge_sightings mine WHERE mine.nudge_id = n.id AND mine.user_id = auth.uid()),
         extensions.ST_Y((CASE WHEN n.share_exact THEN n.exact_location ELSE n.approx_location END)::extensions.geometry),
         extensions.ST_X((CASE WHEN n.share_exact THEN n.exact_location ELSE n.approx_location END)::extensions.geometry),
         n.share_exact
  FROM public.nudges n
  JOIN public.profiles profile ON profile.id = n.user_id
  WHERE auth.uid() IS NOT NULL AND n.id = p_nudge_id AND n.expires_at > now()
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks block WHERE block.blocker_id = auth.uid() AND block.blocked_id = n.user_id);
$$;

CREATE OR REPLACE FUNCTION public.confirm_sighting(p_nudge_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  nudge_owner uuid;
  new_seen_count bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  SELECT user_id INTO nudge_owner FROM public.nudges WHERE id = p_nudge_id AND expires_at > now();
  IF nudge_owner IS NULL THEN RAISE EXCEPTION 'SkyNudge not found or expired.'; END IF;
  IF nudge_owner = auth.uid() THEN RAISE EXCEPTION 'You cannot confirm your own SkyNudge.'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_blocks block WHERE block.blocker_id = auth.uid() AND block.blocked_id = nudge_owner) THEN RAISE EXCEPTION 'SkyNudge not found or expired.'; END IF;
  INSERT INTO public.nudge_sightings (nudge_id, user_id) VALUES (p_nudge_id, auth.uid()) ON CONFLICT DO NOTHING;
  SELECT count(*) INTO new_seen_count FROM public.nudge_sightings WHERE nudge_id = p_nudge_id;
  RETURN new_seen_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_nudge_as_moment(p_nudge_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  moment_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  INSERT INTO public.sky_moments (user_id, nudge_id, category, captured_at, location_label, direction, landmark, note)
  SELECT auth.uid(), n.id, n.category, n.created_at, coalesce(n.area_label, n.landmark), n.direction, n.landmark, n.note
  FROM public.nudges n WHERE n.id = p_nudge_id
  RETURNING id INTO moment_id;
  IF moment_id IS NULL THEN RAISE EXCEPTION 'SkyNudge not found.'; END IF;
  RETURN moment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_verification(p_full_legal_name text, p_phone_number text, p_consent boolean)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_id uuid;
  current_status public.verification_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  IF p_consent IS DISTINCT FROM true THEN RAISE EXCEPTION 'Consent is required to submit verification.'; END IF;
  IF nullif(trim(p_full_legal_name), '') IS NULL OR nullif(trim(p_phone_number), '') IS NULL THEN RAISE EXCEPTION 'Legal name and phone number are required.'; END IF;
  SELECT verification_status INTO current_status FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF current_status IN ('pending', 'verified') THEN RAISE EXCEPTION 'Verification is already pending or complete.'; END IF;
  INSERT INTO public.verification_requests (user_id, full_legal_name, phone_number, consent_given, consent_at, status)
  VALUES (auth.uid(), trim(p_full_legal_name), trim(p_phone_number), true, now(), 'pending') RETURNING id INTO request_id;
  UPDATE public.profiles SET verification_status = 'pending' WHERE id = auth.uid();
  RETURN request_id;
END;
$$;

-- Administrative only. It is deliberately not granted to anon or authenticated.
CREATE OR REPLACE FUNCTION public.review_verification(p_request_id uuid, p_decision public.verification_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE request_user_id uuid;
BEGIN
  IF p_decision NOT IN ('verified', 'rejected') THEN RAISE EXCEPTION 'Decision must be verified or rejected.'; END IF;
  UPDATE public.verification_requests
  SET status = p_decision, reviewed_at = now(), full_legal_name = NULL, phone_number = NULL
  WHERE id = p_request_id AND status = 'pending'
  RETURNING user_id INTO request_user_id;
  IF request_user_id IS NULL THEN RAISE EXCEPTION 'Pending verification request not found.'; END IF;
  UPDATE public.profiles SET verification_status = p_decision WHERE id = request_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'You must be signed in.'; END IF;
  -- TODO: remove this user's Storage objects through a trusted server or Edge Function.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.create_nudge(public.sky_category, public.nudge_intensity, public.nudge_direction, integer, text, text, text, double precision, double precision, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_nearby_nudges(double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_nudge(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_sighting(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_nudge_as_moment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_verification(text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_verification(uuid, public.verification_status) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_nudge(public.sky_category, public.nudge_intensity, public.nudge_direction, integer, text, text, text, double precision, double precision, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_nudges(double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nudge(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_sighting(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_nudge_as_moment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_verification(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- ============================================================================
-- SUPABASE STORAGE BUCKETS AND OBJECT POLICIES
-- SQL deliberately does not delete Storage objects.
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('nudge-photos', 'nudge-photos', true, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('moment-photos', 'moment-photos', false, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS nudge_photo_upload_own_folder ON storage.objects;
CREATE POLICY nudge_photo_upload_own_folder ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nudge-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS nudge_photo_delete_own_folder ON storage.objects;
CREATE POLICY nudge_photo_delete_own_folder ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'nudge-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS moment_photo_owner_select ON storage.objects;
CREATE POLICY moment_photo_owner_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'moment-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS moment_photo_owner_insert ON storage.objects;
CREATE POLICY moment_photo_owner_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moment-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS moment_photo_owner_update ON storage.objects;
CREATE POLICY moment_photo_owner_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'moment-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'moment-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS moment_photo_owner_delete ON storage.objects;
CREATE POLICY moment_photo_owner_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'moment-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- OPTIONAL PG_CRON CLEAN-UP
-- ============================================================================
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron could not be enabled; scheduled cleanup was skipped.';
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'skynudge-cleanup';
    PERFORM cron.schedule(
      'skynudge-cleanup',
      '15 * * * *',
      $cron$DELETE FROM public.nudge_pings WHERE created_at < now() - interval '1 day'; DELETE FROM public.nudges WHERE expires_at < now() - interval '24 hours';$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling was skipped.';
END $$;

-- ============================================================================
-- REALTIME: publish only pings, never full nudges.
-- ============================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.nudge_pings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN RAISE NOTICE 'supabase_realtime publication is unavailable; realtime setup skipped.';
  WHEN OTHERS THEN RAISE NOTICE 'Realtime publication update was skipped.';
END $$;