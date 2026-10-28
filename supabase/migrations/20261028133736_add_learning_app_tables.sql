-- Learning app data is isolated in its own tables and Supabase project.
create table if not exists public.learning_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  topic text not null check (char_length(btrim(topic)) between 1 and 60),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 500),
  choices jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) between 2 and 4),
  answer text not null check (char_length(btrim(answer)) between 1 and 120),
  hint text not null default '' check (char_length(hint) <= 300),
  icon text not null default '✨' check (char_length(icon) <= 16),
  color text not null default '#e8edff' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_tasks_answer_is_choice check (choices @> jsonb_build_array(answer))
);

create index if not exists learning_tasks_published_created_idx
  on public.learning_tasks (published, created_at desc);
create index if not exists learning_tasks_owner_created_idx
  on public.learning_tasks (owner_id, created_at desc);

alter table public.learning_tasks enable row level security;

create policy "Anyone can read published learning tasks"
  on public.learning_tasks for select to anon, authenticated
  using (published or (select auth.uid()) = owner_id);

create policy "Parents can create their own learning tasks"
  on public.learning_tasks for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Parents can update their own learning tasks"
  on public.learning_tasks for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Parents can remove their own learning tasks"
  on public.learning_tasks for delete to authenticated
  using ((select auth.uid()) = owner_id);

grant select on public.learning_tasks to anon, authenticated;
grant insert, update, delete on public.learning_tasks to authenticated;

create table if not exists public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  done_days integer[] not null default '{}',
  stars integer not null default 0 check (stars >= 0),
  updated_at timestamptz not null default now()
);

alter table public.learning_progress enable row level security;

create policy "Parents can read their own learning progress"
  on public.learning_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Parents can create their own learning progress"
  on public.learning_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Parents can update their own learning progress"
  on public.learning_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.learning_progress to authenticated;
