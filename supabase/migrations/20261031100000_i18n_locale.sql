-- Idiomas: inglés por defecto. El registro envía el idioma de la app en los
-- metadatos (options.data.locale); con él se guarda el perfil y se crean
-- las categorías por defecto en ese idioma. Los perfiles y categorías que
-- ya existen no se tocan (siguen en español).

alter table public.profiles alter column locale set default 'en';
alter table public.profiles
  add constraint profiles_locale_supported check (locale in ('en', 'es'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list_id uuid;
  v_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'en');
begin
  if v_locale not in ('en', 'es') then
    v_locale := 'en';
  end if;

  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    v_locale
  );

  insert into public.lists (name, emoji, owner_id)
  values ('Personal', '💰', new.id)
  returning id into v_list_id;

  -- Las palabras clave mezclan algo del otro idioma: el quick add las
  -- entiende igual si alguien escribe "lunch" con la app en español.
  if v_locale = 'es' then
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
  else
    insert into public.categories (list_id, name, emoji, color, kind, keywords, sort_order) values
      (v_list_id, 'Food',        '🍔', '#ffd6cc', 'expense', '{food,lunch,dinner,breakfast,restaurant,takeout,pizza,burger,comida,almuerzo}', 0),
      (v_list_id, 'Groceries',   '🥑', '#e1f295', 'expense', '{groceries,grocery,supermarket,market,super,mercado}', 1),
      (v_list_id, 'Coffee',      '☕', '#fccc8e', 'expense', '{coffee,cafe,café,latte,starbucks}', 2),
      (v_list_id, 'Transport',   '🚗', '#cbe7ff', 'expense', '{uber,taxi,gas,fuel,bus,subway,metro,train,parking}', 3),
      (v_list_id, 'Home',        '🏠', '#ffe8a3', 'expense', '{rent,electricity,water,internet,utilities,arriendo}', 4),
      (v_list_id, 'Fun',         '🎮', '#e5d4ff', 'expense', '{movies,cinema,netflix,spotify,games,bar,concert}', 5),
      (v_list_id, 'Shopping',    '🛍️', '#ffc8dd', 'expense', '{clothes,amazon,gift,shopping,shoes}', 6),
      (v_list_id, 'Health',      '💊', '#c8f2e0', 'expense', '{pharmacy,doctor,medicine,dentist,gym}', 7),
      (v_list_id, 'Other',       '💎', '#f3f3f3', 'expense', '{}', 8),
      (v_list_id, 'Salary',      '💼', '#d4f5c8', 'income',  '{salary,paycheck,payroll,wage,sueldo}', 9);
  end if;

  return new;
end;
$$;
