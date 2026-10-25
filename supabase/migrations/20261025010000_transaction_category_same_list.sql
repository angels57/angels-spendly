-- La categoría de un movimiento debe pertenecer a la misma lista.
-- RLS valida la lista del movimiento, pero no la de su categoría.

alter table public.categories
  add constraint categories_list_id_id_key unique (list_id, id);

alter table public.transactions
  drop constraint transactions_category_id_fkey,
  add constraint transactions_category_same_list_fkey
    foreign key (list_id, category_id)
    references public.categories (list_id, id)
    -- Solo anula category_id: list_id no puede quedar en null.
    on delete set null (category_id);

alter table public.budgets
  drop constraint budgets_category_id_fkey,
  add constraint budgets_category_same_list_fkey
    foreign key (list_id, category_id)
    references public.categories (list_id, id)
    on delete cascade;
