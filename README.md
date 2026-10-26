# Angel’s Spendly

**Tus gastos, claros y sin esfuerzo.** App web (PWA) para anotar gastos e ingresos escribiendo como hablas: `almuerzo 25 mil ayer`, `netflix 15 usd`, `súper 45,50 el viernes pasado`.

🌐 **En producción:** https://angels-spendly.vercel.app

## Qué hace

- **Quick add en lenguaje natural:** detecta monto, moneda, fecha y categoría del texto, sin IA ni conexión. Entiende `25 mil`, `12k` y `1,5 millones`, fechas como `ayer`, `anteayer`, `hace 3 días`, `el 3 de octubre` o `viernes pasado`, y moneda con `usd`, `US$`, `dólares`, `€`, `cop`…
- **Multimoneda:** el peso colombiano (COP) va por defecto. Cada lista tiene una **moneda principal** (se cambia en _Categorías_) y cada movimiento o recurrente puede ir en otra: COP, USD, EUR, MXN, PEN, CLP, ARS, BRL o GBP. Los totales, las barras y los presupuestos se calculan en la principal; el resto se muestra aparte (“Además: US$ 15,00”), porque todavía no hay tipos de cambio.
- **Movimientos:** añadir, editar y borrar con deshacer; búsqueda, filtro por categoría y navegación por meses.
- **Categorías** con emoji, color y palabras clave (las que usa el quick add para elegir la categoría), y **presupuesto mensual** con barra de progreso y aviso de cuánto queda.
- **Recurrentes** (alquiler, suscripciones, sueldo): semanales, mensuales o anuales. Se generan solos cada día con `pg_cron`.
- **Cuentas:** correo y contraseña, sin confirmar el correo; también recuperar contraseña y enlace mágico.
- **PWA:** se instala en el móvil, funciona sin conexión con una página offline, y reintenta lo que guardaste sin red.
- **Modo oscuro** (claro, oscuro o el del sistema) y diseño pensado para móvil.

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
- **Emails → SMTP:** el SMTP incluido solo envía unos pocos correos por hora. Para recuperar contraseñas o usar el enlace mágico con usuarios reales, configura uno propio, por ejemplo Resend (`smtp.resend.com`, puerto 465).

**App (Vercel).** Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Despliegue manual:

```bash
npx vercel deploy --prod
```

> Si el proyecto está en iCloud Drive, despliega desde un `git clone` limpio para no subir las copias `archivo 2.tsx` que crea iCloud.

## Estructura

```
src/
├── app/
│   ├── (app)/              rutas con sesión: cabecera + pestañas
│   │   ├── page.tsx        inicio: resumen del mes, presupuestos, quick add
│   │   ├── transactions/   movimientos: mes, búsqueda, filtro, añadir manual
│   │   ├── categories/     moneda principal, categorías y presupuestos
│   │   ├── recurring/      movimientos recurrentes
│   │   └── actions.ts      Server Actions de movimientos y moneda
│   ├── login/              entrar, crear cuenta, recuperar contraseña, enlace mágico
│   ├── reset-password/     elegir contraseña nueva (desde el correo)
│   ├── auth/callback/      canje del código de los enlaces del correo
│   ├── offline/            página sin conexión (service worker)
│   └── manifest.ts         manifest de la PWA
├── components/             UI de la app (+ ui/ con los componentes shadcn)
├── lib/
│   ├── data.ts             acceso a datos (verifica la sesión)
│   ├── parser/             texto → monto, moneda, fecha, categoría (+ tests)
│   ├── money.ts            monedas, formato y totales por moneda (+ tests)
│   ├── schemas.ts          validación Zod compartida cliente/servidor
│   ├── budgets.ts, dates.ts, recurrence.ts   utilidades (+ tests)
│   └── supabase/           clientes browser/server, proxy de sesión, tipos
└── proxy.ts                refresca la sesión y protege las rutas
supabase/
├── migrations/             esquema SQL versionado (tablas, RLS, triggers, cron)
└── config.toml             configuración de Supabase local
```

## Notas técnicas

- **Next.js 16:** `middleware.ts` se llama `proxy.ts`. Con `cacheComponents`, lo que lee cookies (la sesión) va dentro de un `<Suspense>`. La documentación de esta versión está en `node_modules/next/dist/docs/`.
- **Montos:** `numeric(12,2)` en la base de datos y centavos (enteros) en el cliente. COP y CLP se muestran sin decimales.
- **Formato de monedas:** todo a la colombiana (`$ 12.000`, `US$ 12,00`, `MXN 12,00`), así `$` solo significa peso colombiano; el euro, `12,00 €`.
- **Seguridad:** todas las tablas tienen RLS y un usuario solo ve las listas de las que es miembro. Las Server Actions validan sesión y datos con Zod. El callback de auth solo redirige a rutas internas.
- **Móvil y teclado:** `interactive-widget=resizes-content` hace que Android encoja la página al abrir el teclado. iOS lo ignora, así que `KeyboardInset` publica la altura del teclado en `--keyboard-inset` y los drawers suben por encima. Los campos usan 16 px o más para que iOS no haga zoom, y los botones miden unos 44 px.
- **Recurrentes:** `generate_recurring()` crea los movimientos pendientes; `pg_cron` la ejecuta a las 00:15 UTC y la app la llama al crear un recurrente.
- **PWA:** `public/sw.js` cachea los assets y muestra `/offline` sin red; nunca guarda páginas con datos del usuario. Solo se registra en producción.
- **Pre-commit:** Husky corre lint-staged (ESLint + Prettier) y los tests.

## Pendiente

- Tipos de cambio para sumar monedas distintas en un solo total.
- Fase 3: IA para varios gastos en una frase, voz y foto del ticket.
- Fase 4: listas compartidas, exportar y suscripción.
- Zona horaria del usuario: hoy “hoy” y el cron usan UTC.
