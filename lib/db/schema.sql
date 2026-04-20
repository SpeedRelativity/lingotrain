-- Run this in the Supabase SQL editor to set up the schema

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  level text not null default 'N5',
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  started_at timestamptz default now(),
  ended_at timestamptz,
  topic text,
  turn_count int not null default 0
);

create table if not exists turns (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade,
  turn_index int not null,
  speaker text not null check (speaker in ('user', 'yuki')),
  text_ja text,
  text_en text,
  audio_url text,
  created_at timestamptz default now()
);

create table if not exists corrections (
  id uuid primary key default uuid_generate_v4(),
  turn_id uuid references turns(id) on delete cascade,
  raw text,
  corrected text,
  severity text check (severity in ('minor', 'major')),
  breakdown_json jsonb,
  explanation_en text
);

create table if not exists tray_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  turn_id uuid references turns(id) on delete set null,
  type text not null check (type in ('vocab', 'grammar', 'particle', 'expression')),
  jp text not null,
  reading text,
  en text not null,
  example_jp text,
  example_en text,
  source text check (source in ('yuki_introduced', 'user_error', 'user_unknown')),
  created_at timestamptz default now()
);

create table if not exists user_vocab (
  user_id uuid references users(id) on delete cascade,
  jp text not null,
  first_seen_at timestamptz default now(),
  times_seen int not null default 1,
  times_used_correctly int not null default 0,
  primary key (user_id, jp)
);

-- Indexes
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_turns_session_id on turns(session_id);
create index if not exists idx_tray_items_session_id on tray_items(session_id);
create index if not exists idx_user_vocab_user_id on user_vocab(user_id);

-- Seed the single MVP user (change email as needed)
insert into users (email, level) values ('necharkc@gmail.com', 'N5')
on conflict (email) do nothing;
