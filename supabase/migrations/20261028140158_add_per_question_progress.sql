alter table public.learning_progress
  add column if not exists task_progress jsonb not null default '{}'::jsonb
  check (jsonb_typeof(task_progress) = 'object' and octet_length(task_progress::text) <= 10000);
