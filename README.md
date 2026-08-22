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
```

## Estructura

```
src/
├── components/
│   ├── auth/        # ProtectedRoute, AuthProvider
│   ├── layout/      # AdminLayout, TrainerLayout, MemberLayout, AuthLayout, Sidebar
│   └── ui/
│       ├── atoms/   # Button, Input, Badge, Avatar, etc.
│       ├── molecules/ # Modal, TabBar, Pagination, etc.
│       └── layout/  # BottomNav
├── lib/             # Supabase client
├── pages/
│   ├── auth/        # Login, Register
│   ├── dashboard/   # Admin pages
│   ├── trainer/     # Trainer pages
│   ├── member/      # MyPlan
│   └── kiosk/       # CheckIn
├── services/        # Business services
├── store/           # Zustand stores
├── App.tsx          # Router principal
├── main.tsx         # Entry point
└── index.css        # Tailwind v4 + theme
```
