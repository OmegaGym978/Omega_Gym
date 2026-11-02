# 17_member_profile_decisions.md

## Decisión: perfil del miembro y accesos

**Fecha**: 2026-10-29
**Contexto**: Omega Gym — vista de Perfil del miembro
**Autor**: Desarrollador asistido por IA

### Cambios

1. **Métricas del header.** Solo quedan `Meses` y `Entrenos`; se retira
   `Visitas` porque duplicaba información con la sección de actividad y no
   aportaba al miembro en esta vista.
2. **Filtros de Actividad.** Quedan `Duración`, `Volumen` y `Repeticiones`.
   Se retira `Visitas`, que era el único filtro con datos reales: alimentaba
   `ActivityChart` con los check-ins. Al quitarlo, la tarjeta muestra su estado
   vacío hasta que existan métricas de entrenamiento.
3. **Botón Calendario.** Queda deshabilitado (`opacity-50`,
   `cursor-not-allowed`) con la etiqueta "Próximamente" debajo del título, en
   lugar de navegar a `/my-checkins`. Se eligió deshabilitarlo en vez de
   eliminarlo para conservar la retícula de 2×2 y señalar que la función
   existirá.
4. **Menú "Más".** Se elimina la fila `Asistencia` de `memberNav.more` y
   también de la sección "Mi cuenta" del drawer, para que el miembro no tenga
   ningún acceso visible a la asistencia.

### Consecuencia conocida

La ruta `/my-checkins` y la página `MyCheckins` se conservan sin enlaces de
navegación. Si se decide reactivar la asistencia, basta devolver la entrada a
`memberNav` y quitar el `disabled` del botón Calendario; no hay que reescribir
la vista ni el servicio.

### Datos

`checkInsService.countByMember` y `getSinceByMember` dejaron de usarse en
`MyProfile`; la vista ahora solo consulta la membresía activa (una query menos).
El servicio sigue disponible para otras pantallas.

### Aplicación

- `src/pages/member/MyProfile.tsx`
- `src/components/layout/nav-config.ts`
