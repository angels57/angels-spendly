-- Los recurrentes se generaban con current_date, que es la fecha UTC: en
-- Colombia, los de mañana aparecían hoy a las 7:15 de la noche. Ahora cada
-- lista usa la fecha local de su dueño.

-- La guarda la app con la zona horaria del dispositivo.
alter table public.profiles
  add column time_zone text not null default 'America/Bogota';

-- Hoy en esa zona horaria. Si el nombre no existe en Postgres, la de
-- siempre: así una zona rara no detiene la generación de todos.
create function public.local_today(p_time_zone text)
returns date
language plpgsql
stable
set search_path = ''
as $$
begin
  return (now() at time zone p_time_zone)::date;
exception when others then
  return (now() at time zone 'America/Bogota')::date;
end;
$$;

-- p_until pasa a ser opcional: sin él, hasta hoy en la zona del dueño de
-- cada lista. Cambia el valor por defecto, así que se recrea.
drop function public.generate_recurring(uuid, date);

create function public.generate_recurring(
  p_list_id uuid default null,
  p_until date default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_date date;
  v_count int;
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
    select rt.*, coalesce(p_until, public.local_today(p.time_zone)) as until
    from public.recurring_transactions rt
    join public.lists l on l.id = rt.list_id
    left join public.profiles p on p.id = l.owner_id
    where rt.next_run <= coalesce(p_until, public.local_today(p.time_zone))
      and (rt.end_date is null or rt.next_run <= rt.end_date)
      and (p_list_id is null or rt.list_id = p_list_id)
    for update of rt skip locked
  loop
    v_date := r.next_run;
    v_count := r.generated_count;
    while v_date <= r.until and (r.end_date is null or v_date <= r.end_date) loop
      insert into public.transactions (
        list_id, category_id, created_by, amount, currency,
        occurred_on, note, source, recurring_id
      )
      values (
        r.list_id, r.category_id, r.created_by, r.amount, r.currency,
        v_date, r.note, 'recurring', r.id
      )
      on conflict (recurring_id, occurred_on) do nothing;

      v_count := v_count + 1;
      v_date := public.recurrence_date(
        r.start_date, r.frequency, v_count, r.first_day, r.second_day
      );
      v_created := v_created + 1;
    end loop;

    update public.recurring_transactions
    set generated_count = v_count, next_run = v_date
    where id = r.id;
  end loop;

  return v_created;
end;
$$;

revoke execute on function public.generate_recurring(uuid, date) from public, anon;
grant execute on function public.generate_recurring(uuid, date) to authenticated, service_role;

-- Cada hora (no una vez al día en UTC): cada lista recibe sus movimientos
-- poco después de su medianoche. Mismo nombre: reemplaza la tarea diaria.
select cron.schedule(
  'generate-recurring-transactions',
  '5 * * * *',
  $$ select public.generate_recurring(); $$
);
