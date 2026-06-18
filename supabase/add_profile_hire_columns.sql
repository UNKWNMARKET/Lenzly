-- Add hire-related columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available      boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS second_shooter boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS price_range    text;
