-- Add conversation_id to notifications so hire_request can link directly to chat
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL;
