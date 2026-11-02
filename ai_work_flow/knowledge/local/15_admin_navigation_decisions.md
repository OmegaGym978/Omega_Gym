# 15_admin_navigation_decisions.md

## Decisión: barra inferior y perfil del administrador

**Fecha**: 2026-10-29
**Contexto**: Omega Gym — navegación por rol
**Autor**: Desarrollador asistido por IA

### Problema

La barra del administrador tenía `Inicio · Miembros · Pagos · Perfil`, dejando
Membresías y Planes en la hoja "Más". Esos dos módulos son de uso diario para el
admin (asignar membresías, revisar cobros, editar planes), mientras que Pagos y
Perfil son de consulta ocasional. Además, el perfil del admin mostraba su propio
progreso de entrenamiento (meses, visitas, entrenos y gráfica de actividad), que
no aporta nada a su trabajo.

### Opciones evaluadas

#### Opción 1: solo reordenar la hoja "Más"
**Pros**: cero riesgo.
**Contras**: Membresías y Planes siguen a dos toques, que es donde más se usan.

#### Opción 2: mover Membresías y Planes a la barra y Pagos/Perfil a "Más"
**Pros**: deja en la barra los módulos operativos; Pagos y Perfil siguen
accesibles desde "Más" y desde el drawer.
**Contras**: la barra queda con 4 pestañas + Más (5 slots) y las etiquetas bajan
a 9 px; el badge de cobros pendientes se pierde si "Más" no soporta badges.

### Decisión Final

**Selección**: Opción 2.

- `adminNav.tabs`: Inicio, Miembros, Membresías, Planes.
- `adminNav.more`: Pagos (con `badgeKey: 'pendingPayments'`), Perfil y Huella
  (solo DEV).
- `ListTile` acepta `badge?: number` y `MoreSheet` recibe `badges`, para que el
  contador de cobros pendientes siga visible dentro de "Más".
- `sections` del drawer no cambian: contienen todas las secciones.

### Perfil del administrador

`MyProfile` oculta para `role === 'admin'`:

- el bloque `Meses / Visitas / Entrenos`;
- la tarjeta **Actividad** (gráfica y filtros Duración/Volumen);
- la sección **Información** con su cuadrícula de accesos personales
  (Estadísticas, Ejercicios, Medidas, Calendario).

Se conservan avatar, nombre, badge de rol y los botones superiores (Editar
perfil, Compartir, Ajustes). Para el admin se omiten las consultas de
`check_ins` y de sesiones, que solo alimentaban las secciones ocultas.

### Aplicación

- `src/components/layout/nav-config.ts`
- `src/components/ui/molecules/ListTile.tsx`
- `src/components/ui/layout/MoreSheet.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/pages/member/MyProfile.tsx`

### Consecuencia conocida

Con cinco slots la etiqueta de la barra se reduce a 9 px (`BottomNav` lo hace
automático con `slotCount >= 5`). "Membresías" es la etiqueta más larga y cabe
en 360 px sin truncarse.
