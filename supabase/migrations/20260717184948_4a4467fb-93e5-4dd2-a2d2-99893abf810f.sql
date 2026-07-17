
-- Organization settings (single row)
CREATE TABLE public.organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Yayasan Generasi Cerdas Beraksi',
  short_name TEXT NOT NULL DEFAULT 'GEN-CB',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT 'yayasangencb@gmail.com',
  website TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  ketua_name TEXT DEFAULT '',
  sekretaris_name TEXT DEFAULT '',
  ttd_ketua_url TEXT DEFAULT '',
  ttd_sekretaris_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization TO anon, authenticated;
GRANT ALL ON public.organization TO service_role;
ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org read all" ON public.organization FOR SELECT USING (true);
CREATE POLICY "org write all" ON public.organization FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.organization (name, short_name, email) VALUES
  ('Yayasan Generasi Cerdas Beraksi', 'GEN-CB', 'yayasangencb@gmail.com');

-- Letter counter per (year, letter_type_code) — atomic increments
CREATE TABLE public.letter_counter (
  year INT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.letter_counter TO anon, authenticated;
GRANT ALL ON public.letter_counter TO service_role;
ALTER TABLE public.letter_counter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "counter all" ON public.letter_counter FOR ALL USING (true) WITH CHECK (true);

-- Function to atomically get next letter number for a year
CREATE OR REPLACE FUNCTION public.next_letter_number(p_year INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_num INT;
BEGIN
  INSERT INTO public.letter_counter (year, last_number)
  VALUES (p_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_number = public.letter_counter.last_number + 1
  RETURNING last_number INTO new_num;
  RETURN new_num;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_letter_number(INT) TO anon, authenticated;

-- Letters
CREATE TABLE public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_number TEXT NOT NULL UNIQUE,
  number_int INT NOT NULL,
  year INT NOT NULL,
  letter_type TEXT NOT NULL,
  letter_date DATE NOT NULL,
  lampiran TEXT DEFAULT '',
  perihal TEXT NOT NULL,
  kepada TEXT DEFAULT '',
  instansi TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  isi_surat TEXT DEFAULT '',
  hari TEXT DEFAULT '',
  tanggal_acara DATE,
  jam TEXT DEFAULT '',
  tempat TEXT DEFAULT '',
  penutup TEXT DEFAULT '',
  ketua_name TEXT DEFAULT '',
  sekretaris_name TEXT DEFAULT '',
  jabatan TEXT DEFAULT '',
  ttd_ketua_url TEXT DEFAULT '',
  ttd_sekretaris_url TEXT DEFAULT '',
  extra_logo_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'valid',
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.letters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.letters TO authenticated;
GRANT ALL ON public.letters TO service_role;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "letters public read" ON public.letters FOR SELECT USING (true);
CREATE POLICY "letters write" ON public.letters FOR INSERT WITH CHECK (true);
CREATE POLICY "letters update" ON public.letters FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "letters delete" ON public.letters FOR DELETE USING (true);

CREATE INDEX letters_created_at_idx ON public.letters(created_at DESC);
CREATE INDEX letters_type_idx ON public.letters(letter_type);

-- Flyers (for Phase 2, table already available)
CREATE TABLE public.flyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  event_date DATE,
  event_time TEXT DEFAULT '',
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  organizer TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  bg_url TEXT DEFAULT '',
  qr_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flyers TO anon, authenticated;
GRANT ALL ON public.flyers TO service_role;
ALTER TABLE public.flyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flyers all" ON public.flyers FOR ALL USING (true) WITH CHECK (true);
