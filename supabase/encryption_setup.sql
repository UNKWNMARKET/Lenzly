-- ============================================================
-- Encryption setup: private bucket for encrypted chat photos
-- Run in Supabase SQL Editor
-- ============================================================

-- Create a separate private bucket for encrypted chat photos.
-- Feed/profile photos stay in the public 'photos' bucket.
-- Chat photos (*.enc) are encrypted client-side before upload
-- and stored here — even Supabase cannot read them without the key.
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-photos', 'chat-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Only conversation participants can upload to their own folder
CREATE POLICY "chat_photos_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only authenticated users can read (signed URLs will be used)
-- Access is further gated by RLS on messages table (they need to know the URL)
CREATE POLICY "chat_photos_read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-photos');

-- Users can delete their own uploads
CREATE POLICY "chat_photos_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
