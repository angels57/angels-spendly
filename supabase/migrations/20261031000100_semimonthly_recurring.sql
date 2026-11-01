-- Días de la quincena de cada recurrente. 31 = último día del mes (en
-- febrero cae el 28 o 29). El primero llega hasta el 27 para que los dos
-- nunca caigan el mismo día.

alter table public.recurring_transactions
  add column first_day smallint,
  add column second_day smallint,
  add constraint recurring_transactions_semimonthly_days check (
    coalesce(
      case frequency
        when 'semimonthly' then
          first_day between 1 and 27 and second_day between first_day + 1 and 31
        else first_day is null and second_day is null
      end,
      false
    )
  );

-- Día p_day del mes que empieza en p_month, sin pasarse del último.
create function public.clamp_month_day(p_month date, p_day int)
returns date
language sql
immutable
set search_path = ''
as $$
  select p_month + least(
    p_day,
    extract(day from p_month + interval '1 month - 1 day')::int
  ) - 1;
$$;

-- Ocurrencia n de una quincena: la primera es el primer día elegido que no
-- sea anterior a p_start.
create function public.semimonthly_date(
  p_start date,
  p_first_day int,
  p_second_day int,
  p_n int
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_month date := p_start - (extract(day from p_start)::int - 1);
  v_slot int;
begin
  v_slot := p_n + case
    when p_start <= public.clamp_month_day(v_month, p_first_day) then 0
    when p_start <= public.clamp_month_day(v_month, p_second_day) then 1
    else 2
  end;
  return public.clamp_month_day(
    (v_month + make_interval(months => v_slot / 2))::date,
    case when v_slot % 2 = 0 then p_first_day else p_second_day end
  );
end;
$$;

-- recurrence_date gana los días de la quincena (opcionales para el resto).
drop function public.recurrence_date(date, public.recurrence_frequency, int);

create function public.recurrence_date(
  p_start date,
  p_frequency public.recurrence_frequency,
  p_n int,
  p_first_day int default null,
  p_second_day int default null
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case p_frequency
    when 'weekly' then p_start + p_n * 7
    when 'semimonthly' then
      public.semimonthly_date(p_start, p_first_day, p_second_day, p_n)
    when 'monthly' then (p_start + make_interval(months => p_n))::date
    when 'yearly' then (p_start + make_interval(years => p_n))::date
  end;
$$;

-- Igual que antes, pero pasando los días de la quincena.
create or replace function public.generate_recurring(
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
      v_date := public.recurrence_date(
        r.start_date, r.frequency, r.generated_count, r.first_day, r.second_day
      );
      v_created := v_created + 1;
    end loop;

    update public.recurring_transactions
    set generated_count = r.generated_count, next_run = v_date
    where id = r.id;
  end loop;

  return v_created;
end;
$$;
