# Omega Gym

Sistema de gestión de gimnasio web — Vite + React + React Router v7 + Supabase

## Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Routing**: React Router v7
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **State**: Zustand
- **Styling**: Tailwind CSS v4
- **PWA**: vite-plugin-pwa (service worker auto-generado)
- **Notifications**: Sonner

## Scripts

```bash
npm run dev        # Dev server en localhost:5173
npm run build      # Build producción
npm run preview    # Preview build local
```

## Env Vars (`.env`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Solo para scripts locales (Management API). Nunca commitear el valor.
SUPABASE_ACCESS_TOKEN=
```

## Migraciones

El historial de migraciones vive en `supabase/migrations/`. Para aplicarlas a un
proyecto con la Management API:

```bash
# 1. Lista los proyectos a los que el token tiene acceso
node scripts/apply-migration.mjs --list

# 2. Aplica un archivo (recarga PostgREST y verifica)
node scripts/apply-migration.mjs supabase/migrations/20261029000002_plan_exercise_set_details.sql --ref <project-ref>
```

El script lee `SUPABASE_ACCESS_TOKEN` (o `SP_TOKEN`) del entorno o de `.env`, y nunca
imprime el valor. El token se crea en Supabase → Account → Access Tokens.

## Estructura

```
src/
├── components/
│   ├── auth/        # ProtectedRoute, AuthProvider
│   ├── layout/      # AppLayout, NavigationDrawer, nav-config, AuthLayout
│   ├── routine-builder/ # RoutineBuilder, ExerciseMultiPicker, ExerciseConfigSheet
│   ├── schedule/    # ScheduleSheet (días por plan)
│   ├── exercises/   # ExerciseFilterSheet, CreateExerciseSheet
│   ├── workout/     # WorkoutSession (registro y guardado de series)
│   ├── profile/     # ActivityChart
│   └── ui/
│       ├── atoms/   # Button, Input, Badge, MetricCard, Card, Switch, Checkmark
│       ├── molecules/ # Modal, BottomSheet, ConfirmSheet, ListGroup, ListTile, TabBar, ResponsiveTable
│       └── layout/  # BottomNav, MoreSheet, ScreenHeader, PageContainer
├── lib/             # Supabase client, helpers, etiquetas
├── pages/
│   ├── auth/        # Login, Register, recuperación
│   ├── dashboard/   # Admin/entrenador
│   ├── member/      # Mi plan, Entrenamiento, Perfil, Membresía, Asistencia
│   └── kiosk/       # CheckIn
├── services/        # Business services
├── store/           # Zustand (auth, tema, acento, sidebar, pwa)
├── App.tsx          # Router principal
├── main.tsx         # Entry point
└── index.css        # Tailwind v4 + tokens + presets de acento
```

## Tema y acento

El fondo usa negro puro en modo oscuro y la escala `surface` para tarjetas. El acento es
intercambiable desde **Ajustes → Color de acento** (coral por defecto) y se aplica con
`data-accent` sobre `--color-accent`; `--accent-contrast` mantiene el contraste del texto
en botones cuando el acento es claro.
