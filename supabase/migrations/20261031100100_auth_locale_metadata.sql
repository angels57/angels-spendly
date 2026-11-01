-- Las plantillas de correo de Supabase solo ven los metadatos de Auth
-- (.Data), no la tabla profiles. Se copia ahí el idioma de las cuentas que
-- aún no lo tienen (las anteriores al registro con idioma): así siguen
-- recibiendo los correos en español. Desde ahora lo mantienen al día el
-- registro (options.data.locale) y la acción setLocale de Ajustes.

update auth.users u
set raw_user_meta_data =
  coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('locale', p.locale)
from public.profiles p
where p.id = u.id
  and not (coalesce(u.raw_user_meta_data, '{}'::jsonb) ? 'locale');
