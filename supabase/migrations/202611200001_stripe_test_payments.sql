begin;

create table public.stripe_test_payments (
  reference text primary key references public.bookings(reference) on delete cascade,
  attempt_id uuid not null default gen_random_uuid(),
  amount bigint not null check (amount > 0),
  currency text not null default 'usd' check (currency = 'usd'),
  state text not null default 'creating' check (state in ('creating', 'open', 'processing', 'paid', 'failed', 'expired')),
  session_id text unique,
  created_at timestamptz not null default now()
);
alter table public.stripe_test_payments enable row level security;
revoke all on public.stripe_test_payments from anon, authenticated;
grant select on public.stripe_test_payments to authenticated;
create policy stripe_test_admin_read on public.stripe_test_payments for select to authenticated using (public.is_admin());
grant all on public.stripe_test_payments to service_role;

create function public.reserve_stripe_test_payment(p_reference text)
returns public.stripe_test_payments
language plpgsql security definer set search_path = ''
as $$
declare
  b public.bookings%rowtype;
  p public.stripe_test_payments%rowtype;
  cents bigint;
begin
  select * into b from public.bookings where reference = p_reference for update;
  if not found or b.status <> 'confirmed' or coalesce((to_jsonb(b)->>'paid')::boolean, false) then
    raise exception 'Booking must be confirmed and unpaid.';
  end if;
  cents := round((b.total + b.deposit) * 100);
  if cents is null or cents < 50 or b.deposit < 0 or b.total < 0 then
    raise exception 'Invalid booking amount.';
  end if;
  select * into p from public.stripe_test_payments where reference = p_reference for update;
  if found and p.state not in ('failed', 'expired') then return p; end if;
  insert into public.stripe_test_payments(reference, amount)
  values (p_reference, cents)
  on conflict (reference) do update set attempt_id = gen_random_uuid(), amount = cents,
    state = 'creating', session_id = null, created_at = now()
  returning * into p;
  return p;
end $$;
revoke all on function public.reserve_stripe_test_payment(text) from public, anon, authenticated;
grant execute on function public.reserve_stripe_test_payment(text) to service_role;

create function public.guard_stripe_test_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.stripe_test_payments where reference = old.reference
      and state in ('creating', 'open', 'processing', 'paid')) and
    (new.car_id, new.pickup_date, new.return_date, new.total, new.deposit, new.status, to_jsonb(new)->>'paid')
      is distinct from
    (old.car_id, old.pickup_date, old.return_date, old.total, old.deposit, old.status, to_jsonb(old)->>'paid') then
    raise exception 'A test checkout is active or paid. Resolve the test payment before changing this booking.';
  end if;
  return new;
end $$;
create trigger guard_stripe_test_booking before update on public.bookings
for each row execute function public.guard_stripe_test_booking();

commit;
