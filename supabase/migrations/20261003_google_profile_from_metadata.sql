-- Google OAuth users have no password and no sign-up form. Their display name
-- lives in raw_user_meta_data as `name` (and sometimes `full_name`). Make the
-- new-user trigger idempotent so a returning Google account never duplicates
-- a profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
