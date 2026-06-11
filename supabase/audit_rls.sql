-- ============================================================================
-- RLS AUDIT — run this in the Supabase SQL editor to verify security posture.
-- These are READ-ONLY diagnostic queries (sections 1–3) followed by an
-- OPTIONAL safety net (section 4) that enables RLS on any public table that
-- somehow has it turned off. Review section 1–3 output before running 4.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables in the public schema that DO NOT have RLS enabled.
--    Anything listed here is readable/writable by anyone with the anon key.
--    This list should be EMPTY (or contain only intentionally-public tables).
-- ----------------------------------------------------------------------------
SELECT
  n.nspname            AS schema,
  c.relname            AS table,
  c.relrowsecurity     AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'              -- ordinary tables only
  AND c.relrowsecurity = false     -- RLS OFF
ORDER BY c.relname;

-- ----------------------------------------------------------------------------
-- 2. Tables that HAVE RLS enabled but have ZERO policies.
--    With RLS on and no policies, the table is fully locked (no access).
--    Usually a mistake — every such table should have at least a SELECT policy.
-- ----------------------------------------------------------------------------
SELECT
  c.relname AS table_with_rls_but_no_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
  )
ORDER BY c.relname;

-- ----------------------------------------------------------------------------
-- 3. Full policy dump — review each policy's USING / WITH CHECK expression.
--    Watch for overly-permissive rules, e.g. `qual = true` on SELECT, which
--    would let any authenticated user read EVERY row in the table.
-- ----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  cmd          AS command,        -- SELECT / INSERT / UPDATE / DELETE / ALL
  roles,
  qual         AS using_expr,     -- row-visibility filter
  with_check   AS check_expr      -- write-validation filter
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ----------------------------------------------------------------------------
-- 3b. Specifically flag SELECT policies that expose every row (qual = true).
--     Sensitive tables (notifications, messages, conversations, saved_posts,
--     blocks, reports) should NEVER appear here.
-- ----------------------------------------------------------------------------
SELECT tablename, policyname, qual AS using_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND (qual IS NULL OR btrim(qual) = 'true')
ORDER BY tablename;

-- ============================================================================
-- 4. OPTIONAL SAFETY NET — enable RLS on every public table that has it off.
--    Run ONLY after reviewing section 1. Tables meant to be fully public
--    (none in Lenzly today) should be excluded here.
--    Enabling RLS with no policies LOCKS the table, so this also keeps a
--    record of which tables it touched — add policies for any it enables.
-- ============================================================================
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN
--     SELECT c.relname
--     FROM pg_class c
--     JOIN pg_namespace n ON n.oid = c.relnamespace
--     WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false
--   LOOP
--     RAISE NOTICE 'Enabling RLS on public.%', r.relname;
--     EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
--   END LOOP;
-- END $$;
