# Angel’s Spendly

**Tus gastos, claros y sin esfuerzo.** App web (PWA) para anotar gastos e ingresos escribiendo como hablas: `almuerzo 25 mil ayer`, `netflix 15 usd`, `súper 45,50 el viernes pasado`.

🌐 **En producción:** https://angels-spendly.vercel.app

## Qué hace

- **Inglés y español:** inglés por defecto; el idioma va en la URL (`/en/…`, `/es/…`) y se elige en _Ajustes_ (se guarda en la cuenta). Textos, fechas, formatos de dinero, CSV, categorías iniciales y correos en el idioma de cada persona.
- **Quick add en lenguaje natural:** detecta monto, moneda, fecha y categoría del texto, sin IA ni conexión. En español y en inglés: `25 mil`, `12k`, `1,5 millones`, `2 thousand`, `1.5 million`; fechas como `ayer`, `hace 3 días`, `el 3 de octubre`, `yesterday` o `last friday`; y moneda con `usd`, `US$`, `dólares`, `dollars`, `bucks`, `€`, `cop`…
- **Multimoneda:** el peso colombiano (COP) va por defecto. Cada lista tiene una **moneda principal** (se cambia en _Ajustes_) y cada movimiento o recurrente puede ir en otra: COP, USD, EUR, MXN, PEN, CLP, ARS, BRL o GBP. Los totales, las barras y los presupuestos se calculan en la principal; el resto se muestra aparte (“Además: US$ 15,00”), porque todavía no hay tipos de cambio.
- **Movimientos:** añadir, editar y borrar con deshacer; búsqueda, filtro por categoría y navegación por meses.
- **Categorías** con emoji, color y palabras clave (las que usa el quick add para elegir la categoría), y **presupuesto mensual** con barra de progreso y aviso de cuánto queda.
- **Recurrentes** (alquiler, suscripciones, sueldo): semanales, mensuales o anuales. Se generan solos cada día con `pg_cron`.
- **Cuentas:** correo y contraseña, sin confirmar el correo; también recuperar contraseña y enlace mágico.
- **PWA:** se instala en el móvil, funciona sin conexión con una página offline, y reintenta lo que guardaste sin red.
- **Notificaciones push:** avisos de presupuesto (al 80 % y al 100 %), recurrentes registrados, resumen del mes el día 1 y un recordatorio diario opcional; cada tipo se apaga en _Ajustes_, y se pueden ocultar los importes en la pantalla de bloqueo. En iPhone, con la app instalada (iOS 16.4+).
- **Ajustes:** idioma, moneda principal, tema (claro, oscuro o el del sistema), notificaciones, recurrentes, exportar CSV, instalar la app y cerrar sesión.
- Diseño pensado para móvil: deslizar movimientos y categorías para editar o borrar, guardado instantáneo en el quick add.

## Stack

| Capa         | Tecnología                                                                        |
| ------------ | --------------------------------------------------------------------------------- |
| Frontend     | Next.js 16 (App Router, Cache Components, Server Actions) · React 19 · TypeScript |
| UI           | Tailwind CSS v4 · shadcn/ui (Base UI) · lucide-react · sonner                     |
| Datos y auth | Supabase: Postgres con RLS, Auth, pg_cron                                         |
| Utilidades   | Zod v4 · chrono-node (fechas) · next-themes                                       |
| Calidad      | Vitest · ESLint · Prettier · Husky + lint-staged                                  |
| Despliegue   | Vercel + Supabase Cloud                                                           |

## Desarrollo local

Requisitos: **Node 20+** y **Docker Desktop** abierto (Supabase corre en Docker).

```bash
npm install
npm run db:start          # levanta Supabase local y aplica las migraciones
cp .env.example .env.local
# pega en .env.local la "Publishable key" que imprime db:start
npm run dev               # http://localhost:3000
```

| Servicio                  | URL                    |
| ------------------------- | ---------------------- |
| App                       | http://localhost:3000  |
| Supabase Studio (tablas)  | http://127.0.0.1:54323 |
| Mailpit (correos locales) | http://127.0.0.1:54324 |

**Notificaciones en local.** Añade a `.env.local` un par de claves de `npx web-push generate-vapid-keys`. El service worker solo se registra en producción, así que prueba con `npm run build && npm start`. Para que el cron local llame a tu app, apunta el dispatcher a ella (la migración deja la URL de producción, y desde allí un secreto local no sirve):

```bash
docker exec supabase_db_web psql -U postgres -c \
  "update private.push_config set dispatch_url = 'http://host.docker.internal:3000/api/push/dispatch'"
```

### Cuentas de prueba locales

Solo existen en tu Supabase local (no en producción). Si haces `npm run db:reset` se borran; crea una nueva desde _“¿No tienes cuenta? Crear una”_.

| Correo                 | Contraseña                  | Datos                                                |
| ---------------------- | --------------------------- | ---------------------------------------------------- |
| `directo@spendly.test` | `Prueba-Spendly-2026`       | Lista en COP con un gasto en pesos y otro en dólares |
| `clave@spendly.test`   | `Nueva-Spendly-2026`        | Lista en COP, vacía                                  |
| `prueba@monai.test`    | — (entra con enlace mágico) | Lista en EUR con presupuestos y un recurrente        |

Para entrar con **enlace mágico** en local: en `/login` elige _“Entrar sin contraseña”_, abre el correo en Mailpit y pulsa el enlace en el mismo navegador. Los correos nunca salen de tu Mac.

## Scripts

| Script                         | Qué hace                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| `npm run dev`                  | Servidor de desarrollo                                            |
| `npm run build` / `start`      | Build de producción y servirlo (así se prueba la PWA)             |
| `npm test`                     | Tests (Vitest)                                                    |
| `npm run typecheck`            | Verificación de tipos                                             |
| `npm run lint` / `format`      | ESLint / Prettier                                                 |
| `npm run db:start` / `db:stop` | Encender/apagar Supabase local                                    |
| `npm run db:reset`             | Recrear la base y aplicar todas las migraciones (borra los datos) |
| `npm run db:types`             | Regenerar `src/lib/supabase/database.types.ts` desde el esquema   |
| `npm run icons`                | Regenerar los iconos de la PWA (`scripts/generate-icons.mjs`)     |

## Despliegue

**Base de datos (Supabase Cloud).** Con el proyecto enlazado (`npx supabase link --project-ref <ref>`):

```bash
npx supabase db push
```

En el panel de Supabase, _Authentication_:

- **Sign In / Providers → Email:** desactiva _Confirm email_ para entrar al registrarse, y pon la longitud mínima de contraseña en **8**.
- **URL Configuration:** _Site URL_ = `https://angels-spendly.vercel.app`; en _Redirect URLs_ añade `https://angels-spendly.vercel.app/**`.
- **Emails → Templates:** pega las plantillas de `supabase/templates/` (enlace mágico, recuperación y confirmación). Son bilingües según el idioma de la cuenta; el asunto va en los dos idiomas. No uses `supabase config push` para esto: subiría también la configuración local.
- **Emails → SMTP:** el SMTP incluido solo envía unos pocos correos por hora. Para recuperar contraseñas o usar el enlace mágico con usuarios reales, configura uno propio, por ejemplo Resend (`smtp.resend.com`, puerto 465).

**App (Vercel).** Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` (sin las dos últimas, las notificaciones aparecen como no configuradas). Despliegue manual:

```bash
npx vercel deploy --prod
```

> Si el proyecto está en iCloud Drive, despliega desde un `git clone` limpio para no subir las copias `archivo 2.tsx` que crea iCloud.

## Estructura

```
src/
├── app/
│   ├── [lang]/                 /en/… y /es/…: todo lo que ve el usuario
│   │   ├── layout.tsx          layout raíz: <html lang>, generateStaticParams (en, es)
│   │   ├── (app)/              rutas con sesión: cabecera + pestañas
│   │   │   ├── page.tsx        inicio: resumen del mes, presupuestos, quick add
│   │   │   ├── transactions/   movimientos: mes, búsqueda, filtro, añadir manual
│   │   │   ├── categories/     categorías y presupuestos
│   │   │   ├── recurring/      movimientos recurrentes
│   │   │   ├── settings/       ajustes (+ export/ con el CSV)
│   │   │   └── actions.ts      Server Actions de movimientos, moneda e idioma
│   │   ├── login/              entrar, crear cuenta, recuperar contraseña, enlace mágico
│   │   ├── reset-password/     elegir contraseña nueva (desde el correo)
│   │   └── offline/            página sin conexión (service worker)
│   ├── auth/callback/          canje del código de los correos (sin idioma en la URL)
│   └── manifest.ts             manifest de la PWA (en inglés)
├── components/             UI de la app (+ ui/ con los componentes shadcn)
├── i18n/
│   ├── config.ts               idiomas, prefijos y Accept-Language (+ tests)
│   ├── dictionaries/           en.ts (fuente de verdad) y es.ts (mismas claves)
│   ├── server.ts, request.ts   idioma en Server Components / Actions y Route Handlers
│   ├── provider.tsx            useT(), useLocale(), useLocalHref() en el cliente
│   └── errors.ts               códigos de error de las Server Actions
├── lib/
│   ├── data.ts             acceso a datos (verifica la sesión)
│   ├── parser/             texto → monto, moneda, fecha, categoría (+ tests)
│   ├── money.ts            monedas, formato y totales por moneda (+ tests)
│   ├── schemas.ts          validación Zod compartida cliente/servidor
│   ├── budgets.ts, dates.ts, recurrence.ts   utilidades (+ tests)
│   └── supabase/           clientes browser/server, proxy de sesión, tipos
└── proxy.ts                elige el idioma, refresca la sesión y protege las rutas
supabase/
├── migrations/             esquema SQL versionado (tablas, RLS, triggers, cron)
├── templates/              correos bilingües de Auth
└── config.toml             configuración de Supabase local
```

## Notas técnicas

- **Next.js 16:** `middleware.ts` se llama `proxy.ts`. Con `cacheComponents`, lo que lee cookies (la sesión) va dentro de un `<Suspense>`. La documentación de esta versión está en `node_modules/next/dist/docs/`.
- **Montos:** `numeric(12,2)` en la base de datos y centavos (enteros) en el cliente. COP y CLP se muestran sin decimales.
- **Idiomas:** el idioma es el parámetro raíz `[lang]` (`next/root-params`), así las páginas se pre-renderizan por idioma. Sin prefijo, `proxy.ts` elige: cookie `NEXT_LOCALE` → navegador → inglés; al entrar manda el idioma de la cuenta (`profiles.locale`). Server Actions y Route Handlers leen la cookie; las acciones devuelven códigos de error y la pantalla los traduce. Un test falla si queda texto en español escrito a mano fuera de los diccionarios.
- **Formato de monedas:** en español, a la colombiana (`$ 12.000`, `US$ 12,00`, `12,00 €`), así `$` solo es el peso colombiano; en inglés, como en EE. UU. (`COP 12,000`, `$12.00`, `€12.00`).
- **Seguridad:** todas las tablas tienen RLS y un usuario solo ve las listas de las que es miembro. Las Server Actions validan sesión y datos con Zod. El callback de auth solo redirige a rutas internas.
- **Móvil y teclado:** `interactive-widget=resizes-content` hace que Android encoja la página al abrir el teclado. iOS lo ignora, así que `KeyboardInset` publica la altura del teclado en `--keyboard-inset` y los drawers suben por encima. Los campos usan 16 px o más para que iOS no haga zoom, y los botones miden unos 44 px.
- **Recurrentes:** `generate_recurring()` crea los movimientos pendientes; `pg_cron` la ejecuta cada hora (con la fecha local de cada usuario) y la app la llama al crear un recurrente.
- **PWA:** `public/sw.js` cachea los assets y muestra `/{idioma}/offline` sin red; nunca guarda páginas con datos del usuario. Solo se registra en producción.
- **Notificaciones push:** `web-push` con claves VAPID, sin servicios externos. Qué avisar lo decide Postgres: `push_budget_alert()` al guardar un gasto (en `after()`, sin retrasar la respuesta) y `push_due()` para recurrentes, recordatorio y cierre de mes, a la hora local de cada usuario. Cada aviso se reserva en `notification_log` con una clave única, así no se repite. `pg_cron` llama cada 15 minutos (con `pg_net`) a `/api/push/dispatch` con un secreto generado en la base de datos (`private.push_config`); la ruta no lo guarda, solo se lo pasa a `push_due()`, y no hace falta la clave de servicio. Las suscripciones que el servicio push da por muertas (404/410) se borran.
- **Pre-commit:** Husky corre lint-staged (ESLint + Prettier) y los tests.

## Pendiente

- Tipos de cambio para sumar monedas distintas en un solo total.
- IA para varios gastos en una frase, voz y foto del ticket.
- Listas compartidas y suscripción.
