# Spec Delta

## Purpose

Define el resumen de acción inmediata del miembro (`Inicio`): la rutina programada para hoy, el estado de descanso con estadísticas y la programación semanal de rutinas.

## ADDED Requirements

### Requirement: Rutina de hoy

`Inicio` SHALL mostrar la rutina cuya programación incluye el día actual, con una acción directa para empezar.

#### Scenario: Hay una rutina programada para hoy

- **WHEN** el miembro abre `Inicio` y al menos un plan visible tiene el día actual en su programación
- **THEN** se muestra el nombre de la rutina, el número de ejercicios y series y el volumen planeado
- **AND** se ofrece `Empezar rutina` como acción principal
- **AND** se ofrece `Ver rutina` para consultar los ejercicios sin salir de la pantalla

#### Scenario: Varias rutinas programadas para hoy

- **WHEN** más de un plan visible incluye el día actual
- **THEN** se muestra primero el asignado por el entrenador y después el propio
- **AND** se ofrece un selector "Otra rutina de hoy"

#### Scenario: Sin rutina programada

- **WHEN** ningún plan visible incluye el día actual
- **THEN** se muestra un estado de descanso
- **AND** se muestran la racha, las visitas de la semana y el volumen
- **AND** se ofrece un acceso a `Entrenamiento`

#### Scenario: Sin rutinas

- **WHEN** el miembro no tiene planes visibles
- **THEN** se muestra un estado vacío con acceso a `Entrenamiento`

### Requirement: Inicio no duplica la biblioteca

`Inicio` MUST NOT mostrar la lista completa de ejercicios como contenido permanente.

#### Scenario: Consultar el detalle

- **WHEN** el miembro toca `Ver rutina`
- **THEN** los ejercicios se muestran en una hoja temporal
- **AND** la biblioteca completa sigue viviendo en `Entrenamiento`

### Requirement: Programación semanal de rutinas

El sistema SHALL permitir asignar días de la semana a un plan y MUST persistirlos.

#### Scenario: El miembro programa una rutina propia

- **WHEN** el miembro abre el menú de una rutina propia y elige `Programar días`
- **THEN** puede seleccionar uno o varios días de lunes a domingo
- **AND** al guardar, la rutina aparece en `Inicio` en esos días
- **AND** la tarjeta muestra los días programados

#### Scenario: El staff programa un plan

- **WHEN** el staff abre el detalle de un plan y elige `Programar días`
- **THEN** puede seleccionar los días y guardarlos
- **AND** los miembros asignados ven el plan en `Inicio` esos días

#### Scenario: Quitar la programación

- **WHEN** el usuario guarda sin días seleccionados
- **THEN** el plan deja de aparecer como rutina del día
