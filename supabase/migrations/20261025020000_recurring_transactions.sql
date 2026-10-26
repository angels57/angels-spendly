-- Movimientos recurrentes (alquiler, suscripciones, sueldo…) y su
-- generación automática diaria con pg_cron.

create type public.recurrence_frequency as enum ('weekly', 'monthly', 'yearly');

-- Solo se usa dentro de cuerpos de funciones, así que puede añadirse en la
-- misma migración.
alter type public.transaction_source add value 'recurring';

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  category_id uuid,
  created_by uuid not null default auth.uid() references auth.users (id),
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null,
  note text not null default '',
  frequency public.recurrence_frequency not null default 'monthly',
  start_date date not null,
  end_date date check (end_date is null or end_date >= start_date),
  -- Ocurrencias ya generadas. La siguiente es start_date + n pasos: se
  -- calcula siempre desde el inicio para que el día 31 no derive al 28.
  generated_count int not null default 0,
  next_run date not null,
  created_at timestamptz not null default now(),
  foreign key (list_id, category_id)
    references public.categories (list_id, id)
    on delete set null (category_id)
);

create index recurring_transactions_due_idx
  on public.recurring_transactions (next_run);
create index recurring_transactions_list_id_idx
  on public.recurring_transactions (list_id);

alter table public.recurring_transactions enable row level security;

create policy "recurring_transactions: miembros" on public.recurring_transactions
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

-- Enlace movimiento → regla. Una regla no genera dos veces el mismo día.
alter table public.transactions
  add column recurring_id uuid
    references public.recurring_transactions (id) on delete set null,
  add constraint transactions_recurring_once
    unique (recurring_id, occurred_on);

-- Fecha de la ocurrencia n (0 = start_date).
create function public.recurrence_date(
  p_start date,
  p_frequency public.recurrence_frequency,
  p_n int
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case p_frequency
    when 'weekly' then p_start + p_n * 7
    when 'monthly' then (p_start + make_interval(months => p_n))::date
    when 'yearly' then (p_start + make_interval(years => p_n))::date
  end;
$$;

-- Crea los movimientos pendientes hasta p_until (hoy por defecto).
-- Con p_list_id: solo esa lista (la app, tras crear una regla).
-- Sin p_list_id: todas las listas (solo pg_cron / rol de servicio).
create function public.generate_recurring(
  p_list_id uuid default null,
  p_until date default current_date
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.recurring_transactions%rowtype;
  v_date date;
  v_created int := 0;
begin
  if p_list_id is null then
    if (select auth.uid()) is not null then
      raise exception 'generate_recurring sin lista solo para tareas del sistema';
    end if;
  elsif not public.is_list_member(p_list_id) then
    raise exception 'no eres miembro de esta lista';
  end if;

  for r in
    select * from public.recurring_transactions
    where next_run <= p_until
      and (end_date is null or next_run <= end_date)
      and (p_list_id is null or list_id = p_list_id)
    for update skip locked
  loop
    v_date := r.next_run;
    while v_date <= p_until and (r.end_date is null or v_date <= r.end_date) loop
      insert into public.transactions (
        list_id, category_id, created_by, amount, currency,
        occurred_on, note, source, recurring_id
      )
      values (
        r.list_id, r.category_id, r.created_by, r.amount, r.currency,
        v_date, r.note, 'recurring', r.id
      )
      on conflict (recurring_id, occurred_on) do nothing;

      r.generated_count := r.generated_count + 1;
      v_date := public.recurrence_date(r.start_date, r.frequency, r.generated_count);
      v_created := v_created + 1;
    end loop;

    update public.recurring_transactions
    set generated_count = r.generated_count, next_run = v_date
    where id = r.id;
  end loop;

  return v_created;
end;
$$;

revoke execute on function public.generate_recurring(uuid, date) from public, anon;
grant execute on function public.generate_recurring(uuid, date) to authenticated, service_role;

-- Todos los días a las 00:15 UTC.
create extension if not exists pg_cron;

select cron.schedule(
  'generate-recurring-transactions',
  '15 0 * * *',
  $$ select public.generate_recurring(); $$
);
