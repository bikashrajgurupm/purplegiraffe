-- Run this once in the Supabase SQL editor (Database → SQL Editor) for the
-- purplegiraffe project. This is the only schema change this migration
-- needs — every Purple Giraffe Core table (users, sessions, questions,
-- chat_history) is untouched.

create table if not exists demo_requests (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  company text,
  use_case text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists demo_requests_created_at_idx on demo_requests (created_at desc);
