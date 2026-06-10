-- ============================================================================
-- Find (and optionally clean up) posts whose image no longer exists.
--
-- posts.image_url points at a public Storage URL of the form:
--   https://<proj>.supabase.co/storage/v1/object/public/photos/<uid>/<file>
-- The object name in storage.objects is the part after ".../photos/".
--
-- Because posts and storage live in the same database, we can detect orphans
-- (post row exists, underlying file is gone) with a join — no HTTP needed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DIAGNOSE — posts whose storage object is missing (true "broken image")
-- ----------------------------------------------------------------------------
SELECT
  p.id,
  p.user_id,
  p.caption,
  p.created_at,
  p.image_url,
  split_part(p.image_url, '/object/public/photos/', 2) AS storage_name
FROM public.posts p
WHERE p.image_url LIKE '%/object/public/photos/%'
  AND NOT EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'photos'
      AND o.name = split_part(p.image_url, '/object/public/photos/', 2)
  )
ORDER BY p.created_at DESC;

-- ----------------------------------------------------------------------------
-- 2. DIAGNOSE — posts with a malformed / external / empty image_url
--    (not a photos public URL at all — e.g. blob:, data:, null, old domain)
-- ----------------------------------------------------------------------------
SELECT id, user_id, caption, created_at, image_url
FROM public.posts
WHERE image_url IS NULL
   OR image_url = ''
   OR image_url NOT LIKE '%/object/public/photos/%'
ORDER BY created_at DESC;

-- ----------------------------------------------------------------------------
-- 3. CLEANUP (DESTRUCTIVE — review the rows from #1 and #2 first, then run).
--    Deletes posts whose image file is missing. Uncomment to execute.
-- ----------------------------------------------------------------------------
-- DELETE FROM public.posts p
-- WHERE p.image_url LIKE '%/object/public/photos/%'
--   AND NOT EXISTS (
--     SELECT 1 FROM storage.objects o
--     WHERE o.bucket_id = 'photos'
--       AND o.name = split_part(p.image_url, '/object/public/photos/', 2)
--   );

-- Optional: also remove posts with no usable image at all.
-- DELETE FROM public.posts
-- WHERE image_url IS NULL OR image_url = '';
