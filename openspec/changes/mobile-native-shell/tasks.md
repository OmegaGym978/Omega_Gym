# Tasks

## 1. Fundación (TKT-OMEGYM-032)

- [x] 1.1 Reescribir `src/index.css`: negro puro, escala neutra (`surface` 1-4, `text` 1-4), bordes, radios y `safe-area`
- [x] 1.2 Implementar acento intercambiable con `data-accent` y presets (coral, ember, violeta, turquesa, lima, ámbar) + `--accent-contrast`
- [x] 1.3 Crear `store/accent.store.ts` y selector de color en Ajustes
- [x] 1.4 Eliminar el azul del tema y migrar sus usos a acento/teal/gris
- [x] 1.5 Migrar hex de acento hardcodeados a `rgba(var(--accent-rgb), α)`
- [x] 1.6 Actualizar átomos: `Button` píldora, `Input/Textarea/Select` nativos, `Badge/Chip` redondeados, `MetricCard` `rounded-2xl`

## 2. Shell y navegación (TKT-OMEGYM-033)

- [x] 2.1 Crear `AppLayout` único con barra inferior por rol, hoja "Más" y badge de pagos
- [x] 2.2 Crear `NavigationDrawer` y eliminar `Sidebar`, `sidebar-config` y el rail de 56px
- [x] 2.3 Crear `ScreenHeader` y `PageContainer`; sustituir los 10 breadcrumbs
- [x] 2.4 Configurar tabs por rol (miembro, admin, entrenador)
- [x] 2.5 Ajustar `RootRedirect` del miembro a `/my-plan` y actualizar el delta de `member-training-hub`
- [x] 2.6 Centrar vistas de miembro (560px) y auth; staff hasta 1100px

## 3. Pantallas de staff (TKT-OMEGYM-034)

- [x] 3.1 `ResponsiveTable`: tarjetas `rounded-2xl` en móvil y tabla en contenedor redondeado en escritorio
- [x] 3.2 `Dashboard`: KPIs 2×2, hero simplificado y tarjetas redondeadas
- [x] 3.3 `Members`, `Memberships`, `Payments`, `MemberDetail`, `Fingerprint`: `ScreenHeader`, contenedores centrados y radios
- [x] 3.4 Sustituir etiquetas de rol azules por acento/teal/gris

## 4. Planes (TKT-OMEGYM-035)

- [x] 4.1 Reescribir `TrainingPlans` con Tailwind (lista apilada, detalle a pantalla completa)
- [x] 4.2 Eliminar `src/styles/training-plans.css` y el último hex hardcodeado
- [x] 4.3 Conservar asignar/quitar/duplicar/editar/eliminar y el detalle de ejercicio

## 5. Auth, kiosko y cierre (TKT-OMEGYM-036)

- [x] 5.1 Auth (login, registro, recuperación, reset) con inputs nativos y botón píldora
- [x] 5.2 Kiosko `CheckIn` sobre negro puro
- [x] 5.3 Modales y `SettingsModal` `rounded-3xl`, cierre en círculo
- [x] 5.4 Barrido de radios en páginas y componentes
- [x] 5.5 `npm run build` sin errores
- [ ] 5.6 QA visual 360/390/768/1280 en tema claro y oscuro (validación del dueño)

## 6. Workflow follow-up

- [x] 6.1 `openspec validate mobile-native-shell --strict`
- [ ] 6.2 Validación manual del dueño y cierre de los tickets 032–036
- [ ] 6.3 Archivar este change cuando los tickets estén cerrados
