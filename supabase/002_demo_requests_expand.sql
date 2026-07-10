-- Run this once in the Supabase SQL editor, AFTER supabase/demo_requests.sql
-- has already been run. This only ADDS columns — it never drops or renames
-- anything, so any leads you've already collected are untouched.
--
-- The old `company` and `use_case` columns are left in place but unused
-- going forward (the new homepage form doesn't ask for a company name or
-- a "closest prototype" choice anymore) — harmless to leave, safe to ignore.

alter table demo_requests add column if not exists business_or_personal text;
alter table demo_requests add column if not exists current_process text;
alter table demo_requests add column if not exists who_will_use text;
alter table demo_requests add column if not exists what_to_track text;
alter table demo_requests add column if not exists ownership_preference text;
alter table demo_requests add column if not exists budget_range text;
alter table demo_requests add column if not exists timeline text;
