# Tasks

## 1. Datos y componentes

- [x] 1.1 Crear `src/components/profile/ActivityChart.tsx` con agregación de visitas por mes (últimos 6) y estado vacío
- [x] 1.2 Reutilizar `checkInsService.getByMember`, `membershipsService.getActiveWithType` y `user.created_at` para las tres estadísticas
- [x] 1.3 Definir las píldoras `Visitas`, `Duración`, `Volumen` y `Repeticiones` con estado activo en acento

## 2. Pantalla de perfil

- [x] 2.1 Cabecera sin breadcrumb: nombre a la izquierda; lápiz, compartir y engranaje a la derecha
- [x] 2.2 Identidad: avatar circular a la izquierda, nombre y tres estadísticas a la derecha
- [x] 2.3 Tarjeta de gráfico `rounded-2xl` con `ActivityChart` y píldoras
- [x] 2.4 Cuadrícula 2×2 `Estadísticas` / `Ejercicios` / `Medidas` / `Calendario` con iconos y avisos
- [x] 2.5 Eliminar los colores azules hardcodeados y el botón duplicado de cerrar sesión
- [x] 2.6 Conectar editar (modal existente), compartir (`navigator.share` + fallback) y ajustes (`SettingsModal`)

## 3. Verificación

- [x] 3.1 Guardar nombre y teléfono desde el modal de edición
- [x] 3.2 Verificar el gráfico con check-ins reales y con cuenta sin visitas
- [x] 3.3 Verificar `Calendario` → `/my-checkins` y los avisos "Próximamente"
- [x] 3.4 Revisar tema oscuro y claro; comprobar que no queda ningún azul hardcodeado
- [x] 3.5 Ejecutar `npm run build` sin errores

## 4. Cierre

- [x] 4.1 Registrar el ticket `TKT-OMEGYM-031`
- [ ] 4.2 Validación manual del dueño del proyecto antes de cerrar el ticket
