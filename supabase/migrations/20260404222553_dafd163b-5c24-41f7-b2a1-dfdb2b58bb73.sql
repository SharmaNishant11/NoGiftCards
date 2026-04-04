
CREATE TABLE public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  live_url text,
  profile jsonb NOT NULL,
  status text DEFAULT 'pending',
  current_node text DEFAULT 'base',
  visited_nodes text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid REFERENCES public.quests(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text DEFAULT '🎁',
  site text NOT NULL,
  price numeric NOT NULL,
  url text NOT NULL,
  image_url text,
  why_text text,
  alchemy_score numeric,
  sub_scores jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.quest_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid REFERENCES public.quests(id) ON DELETE CASCADE,
  role text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Permissive policies for hackathon demo (no auth)
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on quests" ON public.quests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on discoveries" ON public.discoveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on quest_messages" ON public.quest_messages FOR ALL USING (true) WITH CHECK (true);
