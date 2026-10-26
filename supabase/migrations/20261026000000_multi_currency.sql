-- Multimoneda: el peso colombiano pasa a ser la moneda por defecto. Cada
-- lista tiene su moneda principal (la de totales y presupuestos) y cada
-- movimiento o recurrente guarda la suya. La app valida la lista de monedas
-- admitidas (src/lib/money.ts); aquí solo el formato ISO 4217.

alter table public.profiles alter column default_currency set default 'COP';
alter table public.lists alter column currency set default 'COP';

alter table public.profiles
  add constraint profiles_default_currency_iso check (default_currency ~ '^[A-Z]{3}$');
alter table public.lists
  add constraint lists_currency_iso check (currency ~ '^[A-Z]{3}$');
alter table public.transactions
  add constraint transactions_currency_iso check (currency ~ '^[A-Z]{3}$');
alter table public.recurring_transactions
  add constraint recurring_transactions_currency_iso check (currency ~ '^[A-Z]{3}$');

-- Las listas en EUR que aún no tienen movimientos ni recurrentes se crearon
-- con el valor por defecto anterior: pasan a COP. Las que ya tienen datos
-- se quedan como están (se puede cambiar en la app).
update public.lists l
set currency = 'COP'
where l.currency = 'EUR'
  and not exists (select 1 from public.transactions t where t.list_id = l.id)
  and not exists (select 1 from public.recurring_transactions r where r.list_id = l.id);

update public.profiles set default_currency = 'COP' where default_currency = 'EUR';
