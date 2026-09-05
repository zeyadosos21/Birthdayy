insert into public.birthday_admins (user_id)
select id
from auth.users
where lower(email) = lower('zeyadosos1@gmail.com')
on conflict (user_id) do nothing;

select
  a.user_id,
  u.email,
  a.created_at
from public.birthday_admins a
join auth.users u on u.id = a.user_id;
