-- Esquema inicial de MonAi web: perfiles, listas, categorías, movimientos y presupuestos.

create type public.list_role as enum ('owner', 'editor');
create type public.category_kind as enum ('expense', 'income');
create type public.transaction_source as enum ('manual', 'text', 'voice', 'ai');

-- Perfiles ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_currency char(3) not null default 'EUR',
  locale text not null default 'es',
  created_at timestamptz not null default now()
);

-- Listas (cuentas compartibles) -------------------------------------------

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  emoji text not null default '💰',
  currency char(3) not null default 'EUR',
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.list_members (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.list_role not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index list_members_user_id_idx on public.list_members (user_id);

-- Categorías --------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  emoji text not null,
  color text not null default '#f3f3f3',
  kind public.category_kind not null default 'expense',
  -- Palabras clave para que el parser local adivine la categoría.
  keywords text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index categories_list_id_idx on public.categories (list_id);

-- Movimientos -------------------------------------------------------------

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id),
  -- Siempre positivo: el signo lo da la categoría (gasto/ingreso).
  amount numeric(12, 2) not null check (amount > 0),
  currency char(3) not null,
  occurred_on date not null default current_date,
  note text not null default '',
  source public.transaction_source not null default 'manual',
  created_at timestamptz not null default now()
);

create index transactions_list_date_idx on public.transactions (list_id, occurred_on desc);

-- Presupuestos ------------------------------------------------------------

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  unique (list_id, category_id)
);

-- Helpers de seguridad ----------------------------------------------------

-- security definer evita la recursión de RLS al consultar list_members.
create function public.is_list_member(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.list_members
    where list_id = p_list_id and user_id = (select auth.uid())
  );
$$;

create function public.is_list_owner(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.list_members
    where list_id = p_list_id and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

-- RLS ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "profiles: ver el propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated using (id = (select auth.uid()));

create policy "lists: ver si es miembro" on public.lists
  for select to authenticated using (public.is_list_member(id));
create policy "lists: crear propias" on public.lists
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "lists: editar si es dueño" on public.lists
  for update to authenticated using (public.is_list_owner(id));
create policy "lists: borrar si es dueño" on public.lists
  for delete to authenticated using (public.is_list_owner(id));

create policy "list_members: ver los de mis listas" on public.list_members
  for select to authenticated using (public.is_list_member(list_id));
create policy "list_members: el dueño gestiona" on public.list_members
  for all to authenticated
  using (public.is_list_owner(list_id))
  with check (public.is_list_owner(list_id));

create policy "categories: miembros" on public.categories
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

create policy "transactions: miembros" on public.transactions
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id) and created_by = (select auth.uid()));

create policy "budgets: miembros" on public.budgets
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

-- Al crear una lista, su dueño pasa a ser miembro 'owner'.
create function public.handle_new_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.list_members (list_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_list_created
  after insert on public.lists
  for each row execute function public.handle_new_list();

-- Al registrarse: perfil + lista "Personal" + categorías por defecto.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));

  insert into public.lists (name, emoji, owner_id)
  values ('Personal', '💰', new.id)
  returning id into v_list_id;

  insert into public.categories (list_id, name, emoji, color, kind, keywords, sort_order) values
    (v_list_id, 'Comida',      '🍔', '#ffd6cc', 'expense', '{comida,almuerzo,cena,desayuno,restaurante,lunch,dinner,food,pizza,burger}', 0),
    (v_list_id, 'Súper',       '🥑', '#e1f295', 'expense', '{super,supermercado,mercado,groceries,compra}', 1),
    (v_list_id, 'Café',        '☕', '#fccc8e', 'expense', '{cafe,café,coffee,starbucks}', 2),
    (v_list_id, 'Transporte',  '🚗', '#cbe7ff', 'expense', '{uber,taxi,gasolina,bus,metro,transporte,gas,parking}', 3),
    (v_list_id, 'Casa',        '🏠', '#ffe8a3', 'expense', '{renta,alquiler,luz,agua,internet,rent}', 4),
    (v_list_id, 'Ocio',        '🎮', '#e5d4ff', 'expense', '{cine,netflix,spotify,juego,salida,bar}', 5),
    (v_list_id, 'Compras',     '🛍️', '#ffc8dd', 'expense', '{ropa,amazon,regalo,shopping,zapatos}', 6),
    (v_list_id, 'Salud',       '💊', '#c8f2e0', 'expense', '{farmacia,doctor,medico,médico,gym,gimnasio}', 7),
    (v_list_id, 'Otros',       '💎', '#f3f3f3', 'expense', '{}', 8),
    (v_list_id, 'Sueldo',      '💼', '#d4f5c8', 'income',  '{sueldo,salario,nomina,nómina,salary,pago}', 9);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
