-- ============================================================
-- SARVYA Supabase Schema v2
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id            text primary key,
  name          text not null default 'Learner',
  age           int,
  language      text not null default 'en',
  accessibility jsonb not null default '{
    "mode":"standard","highContrast":false,"largeText":false,
    "voiceNavigation":false,"screenReaderOptimized":false,
    "reducedMotion":false,"fontSize":16,
    "preferredExplanationStyle":"step-by-step",
    "communicationStyle":"intermediate",
    "audioLearning":false,"simplifiedText":false
  }'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Learning Twin ─────────────────────────────────────────────
create table if not exists twin_states (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              text references profiles(id) on delete cascade,
  current_difficulty   text not null default 'medium',
  predicted_weak_areas text[] default '{}',
  understanding_score  int not null default 50,
  engagement_score     int not null default 50,
  cognitive_load_score int not null default 30,
  recommended_format   text not null default 'text',
  recommended_style    text not null default 'step-by-step',
  adaptation_history   jsonb default '[]'::jsonb,
  updated_at           timestamptz default now(),
  unique(user_id)
);

-- ── Sessions ──────────────────────────────────────────────────
create table if not exists sessions (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                text references profiles(id) on delete cascade,
  subject                text not null default 'General',
  platform               text not null default 'web',
  topics_attempted       text[] default '{}',
  performance_score      int not null default 0,
  completion_rate        float not null default 0,
  adaptations_applied    jsonb default '[]'::jsonb,
  cognitive_load_events  jsonb default '[]'::jsonb,
  accessibility_features text[] default '{}',
  start_time             timestamptz default now(),
  end_time               timestamptz
);

-- ── Cognitive Events ──────────────────────────────────────────
create table if not exists cognitive_events (
  id             uuid primary key default uuid_generate_v4(),
  user_id        text references profiles(id) on delete cascade,
  state          text not null,
  score          int not null,
  indicators     jsonb not null default '{}'::jsonb,
  recommendation jsonb not null default '{}'::jsonb,
  created_at     timestamptz default now()
);

-- ── Companion Messages ────────────────────────────────────────
create table if not exists companion_messages (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text references profiles(id) on delete cascade,
  session_key text not null,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  style       text,
  created_at  timestamptz default now()
);

-- ── Sensor Data ───────────────────────────────────────────────
create table if not exists sensor_data (
  id                 uuid primary key default uuid_generate_v4(),
  device_id          text not null,
  user_id            text references profiles(id) on delete cascade,
  light_level        float not null default 200,
  movement_intensity float not null default 0,
  interaction_count  int not null default 0,
  battery_level      float not null default 100,
  noise_level        float not null default 0,
  temperature        float,
  created_at         timestamptz default now()
);

-- ── RLS ───────────────────────────────────────────────────────
alter table profiles           enable row level security;
alter table twin_states        enable row level security;
alter table sessions           enable row level security;
alter table cognitive_events   enable row level security;
alter table companion_messages enable row level security;
alter table sensor_data        enable row level security;

-- Drop existing policies if re-running
do $$ begin
  drop policy if exists "own profile"    on profiles;
  drop policy if exists "own twin"       on twin_states;
  drop policy if exists "own sessions"   on sessions;
  drop policy if exists "own cognitive"  on cognitive_events;
  drop policy if exists "own companion"  on companion_messages;
  drop policy if exists "own sensors"    on sensor_data;
  drop policy if exists "service all profiles"    on profiles;
  drop policy if exists "service all twin"        on twin_states;
  drop policy if exists "service all sessions"    on sessions;
  drop policy if exists "service all cognitive"   on cognitive_events;
  drop policy if exists "service all companion"   on companion_messages;
  drop policy if exists "service all sensors"     on sensor_data;
exception when others then null;
end $$;

-- User policies
create policy "own profile"   on profiles           for all using (id = current_setting('request.jwt.claims',true)::json->>'sub');
create policy "own twin"      on twin_states        for all using (user_id = current_setting('request.jwt.claims',true)::json->>'sub');
create policy "own sessions"  on sessions           for all using (user_id = current_setting('request.jwt.claims',true)::json->>'sub');
create policy "own cognitive" on cognitive_events   for all using (user_id = current_setting('request.jwt.claims',true)::json->>'sub');
create policy "own companion" on companion_messages for all using (user_id = current_setting('request.jwt.claims',true)::json->>'sub');
create policy "own sensors"   on sensor_data        for all using (user_id = current_setting('request.jwt.claims',true)::json->>'sub');

-- Service role bypass
create policy "service all profiles"    on profiles           for all to service_role using (true);
create policy "service all twin"        on twin_states        for all to service_role using (true);
create policy "service all sessions"    on sessions           for all to service_role using (true);
create policy "service all cognitive"   on cognitive_events   for all to service_role using (true);
create policy "service all companion"   on companion_messages for all to service_role using (true);
create policy "service all sensors"     on sensor_data        for all to service_role using (true);

-- ── Enable Realtime ───────────────────────────────────────────
-- Run these in Supabase Dashboard → Database → Replication
-- Or uncomment and run here:
-- alter publication supabase_realtime add table twin_states;
-- alter publication supabase_realtime add table cognitive_events;
-- alter publication supabase_realtime add table sensor_data;
-- alter publication supabase_realtime add table profiles;
