
ALTER TABLE public.letters
  ADD COLUMN IF NOT EXISTS payload jsonb,
  ADD COLUMN IF NOT EXISTS qr_data text,
  ADD COLUMN IF NOT EXISTS verify_url text;
