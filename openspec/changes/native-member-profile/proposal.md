# Proposal

## Why

La pantalla de perfil del miembro está construida como ficha de panel: breadcrumb, avatar centrado, dos métricas en tarjetas y una lista vertical de datos (email, teléfono, alta). No se parece a una app nativa y usa azules hardcodeados (`rgba(59,130,246,*)`, `#60a5fa`, `#34d399`, `#c084fc`) que no pertenecen a la paleta del proyecto.

El rediseño pide una estructura móvil: cabecera compacta con acciones en iconos, avatar a la izquierda con estadísticas, una tarjeta de gráfico y una cuadrícula de accesos, manteniendo estrictamente el rojo/coral como único acento.

## What Changes

- **Cabecera**: sin breadcrumb; nombre alineado a la izquierda y tres acciones a la derecha (lápiz = editar, compartir, engranaje = ajustes).
- **Identidad**: avatar circular a la izquierda; nombre a la derecha y fila de tres estadísticas compactas (`Meses`, `Visitas`, `Entrenos`).
- **Tarjeta de gráfico** `rounded-2xl`: píldoras `Visitas` (activa por defecto, con barras reales de los últimos 6 meses derivadas de `check_ins`), `Duración`, `Volumen` y `Repeticiones`; las tres últimas muestran `Aún no hay datos` porque no existe registro de sesiones.
- **Cuadrícula 2×2 "Información"**: `Estadísticas`, `Ejercicios`, `Medidas` y `Calendario`, con fondo oscuro, bordes muy redondeados, texto blanco e icono a la izquierda. `Calendario` navega a `/my-checkins`; el resto anuncia "Próximamente".
- **Paleta**: se eliminan los colores azules hardcodeados; todo acento pasa a `--accent` (#e85d5d) y a los tokens del tema (compatible con modo claro).
- **Se conserva** el modal de edición (nombre/teléfono) y el modal de eliminación de cuenta (oculto por bandera).
- **Fuera de alcance**: nuevas tablas o métricas de entrenamiento, edición de correo, subida de foto de perfil y las pantallas de Estadísticas/Medidas/Ejercicios.

## Capabilities

### New Capabilities

- `member-profile`: perfil del miembro en formato móvil, con identidad, estadísticas, actividad y accesos directos.

### Modified Capabilities

<!-- Ninguna: no existía spec previa de perfil. -->

## Impact

- **Código**: `src/pages/member/MyProfile.tsx` (reescrito), `src/components/profile/ActivityChart.tsx` (nuevo). Se reutiliza `SettingsModal` para el engranaje.
- **Datos**: solo lectura de `check_ins` (`checkInsService.getByMember`), sesión activa de membresía y `user.created_at`. Sin cambios de esquema.
- **Navegación**: `Calendario` enlaza a `/my-checkins`; el resto son avisos locales.
- **Accesibilidad**: los iconos de cabecera llevan `aria-label`; las píldoras usan `aria-pressed`.
- **Riesgo**: el gráfico de visitas puede quedar vacío para miembros nuevos; el estado vacío ya está especificado.
