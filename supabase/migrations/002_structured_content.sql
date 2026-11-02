-- Only for projects that already ran the original schema.sql.
-- Existing version 1 rows are retained and migrated by the app on load.
-- Publishing saves the version 2 document in the same fields column.
begin;
alter table public.site_content drop constraint if exists site_content_fields_check;
alter table public.site_content add constraint site_content_fields_check
  check (jsonb_typeof(fields) = 'array' or
    (jsonb_typeof(fields) = 'object' and coalesce(fields->>'version', '') = '2'));
commit;
