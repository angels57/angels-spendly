# MonAi Web

App web de control de gastos. El plan completo está en [`../PLAN-WEB.md`](../PLAN-WEB.md).

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · Vitest

## Requisitos

- Node 20+
- Docker Desktop corriendo (para Supabase local)

## Primeros pasos

```bash
npm install
npm run db:start          # levanta Supabase en Docker y aplica las migraciones
cp .env.example .env.local
# pega en .env.local la "Publishable key" que imprime db:start
npm run dev               # http://localhost:3000
```

Supabase Studio (para ver las tablas): http://127.0.0.1:54323

**Login en local:** en `/login` escribe cualquier correo (por ejemplo `prueba@monai.test`). El correo no sale de tu Mac: ábrelo en Mailpit (http://127.0.0.1:54324) y pulsa el enlace en el mismo navegador.

## Scripts

| Script                         | Qué hace                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| `npm run dev`                  | Servidor de desarrollo                                          |
| `npm run build`                | Build de producción                                             |
| `npm test`                     | Tests (Vitest)                                                  |
| `npm run typecheck`            | Verificación de tipos                                           |
| `npm run lint` / `format`      | ESLint / Prettier                                               |
| `npm run db:start` / `db:stop` | Encender/apagar Supabase local                                  |
| `npm run db:reset`             | Recrear la base y aplicar todas las migraciones                 |
| `npm run db:types`             | Regenerar `src/lib/supabase/database.types.ts` desde el esquema |

## Estructura

```
src/
├── app/
│   ├── (app)/              rutas con sesión: layout con cabecera y pestañas
│   │   ├── page.tsx        inicio: resumen del mes + quick add
│   │   ├── transactions/   movimientos: mes, búsqueda, filtro, añadir manual
│   │   ├── categories/     crear, editar y borrar categorías
│   │   └── actions.ts      Server Actions de movimientos
│   ├── login/              magic link
│   └── auth/callback/      canje del código del magic link
├── components/             UI de la app (+ ui/ con los componentes shadcn)
├── lib/
│   ├── data.ts             capa de acceso a datos (verifica la sesión)
│   ├── parser/             texto natural → monto, fecha, categoría (+ tests)
│   ├── schemas.ts          validación Zod compartida cliente/servidor
│   ├── dates.ts, money.ts  utilidades (+ tests)
│   └── supabase/           clientes browser/server + proxy de sesión + tipos
└── proxy.ts                refresca la sesión y protege las rutas
supabase/
└── migrations/             esquema SQL versionado (tablas + RLS + triggers)
```

## Notas

- **Next.js 16**: `middleware.ts` ahora se llama `proxy.ts`. Con `cacheComponents`, todo lo que lea cookies (la sesión) debe estar dentro de un `<Suspense>`.
- **Montos**: `numeric(12,2)` en la base de datos y centavos (enteros) en el cliente.
- **Seguridad**: todas las tablas tienen RLS; un usuario solo ve las listas de las que es miembro.
- Un pre-commit hook (Husky) corre lint-staged y los tests.
