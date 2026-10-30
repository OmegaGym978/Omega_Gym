# Spec Delta

## Purpose

Define el registro de sesiones de entrenamiento con sus series, la privacidad de esos datos y las estadísticas que alimentan el resumen del miembro.

## ADDED Requirements

### Requirement: Registro de series en la sesión

La sesión de entrenamiento SHALL prellenar peso y repeticiones desde el plan y MUST permitir ajustarlos antes de finalizar.

#### Scenario: Abrir una rutina

- **WHEN** el miembro toca `Empezar rutina`
- **THEN** se muestra cada ejercicio con sus series
- **AND** cada serie tiene peso y repeticiones editables prellenados desde el plan
- **AND** se puede marcar y desmarcar cada serie

#### Scenario: Validación de repeticiones

- **WHEN** una serie marcada no tiene repeticiones
- **THEN** el guardado se bloquea con un aviso

### Requirement: Guardado al finalizar

La sesión MUST guardarse únicamente al finalizar y SHALL registrar encabezado y series completadas.

#### Scenario: Finalizar con series completadas

- **WHEN** el miembro finaliza una sesión con al menos una serie marcada
- **THEN** se guarda una sesión con fecha, plan, número de series y volumen total
- **AND** se guardan las series con peso, repeticiones y ejercicio
- **AND** se confirma el volumen registrado

#### Scenario: Cerrar sin finalizar

- **WHEN** el miembro cierra la sesión antes de finalizar
- **THEN** no se guarda ningún registro

#### Scenario: Finalizar sin series

- **WHEN** el miembro intenta finalizar sin series marcadas
- **THEN** no se guarda la sesión y se muestra un aviso

### Requirement: Privacidad de las sesiones

Las sesiones MUST ser accesibles solo para el miembro dueño.

#### Scenario: Acceso de otro miembro

- **WHEN** otro miembro consulta una sesión ajena
- **THEN** no obtiene resultados

#### Scenario: Acceso del staff

- **WHEN** un administrador o entrenador consulta sesiones de miembros
- **THEN** no obtiene resultados

#### Scenario: Inserción a nombre de otro

- **WHEN** un miembro intenta registrar una sesión para otro miembro
- **THEN** la operación se rechaza

### Requirement: Estadísticas del miembro

`Inicio` SHALL mostrar estadísticas derivadas de la actividad del miembro.

#### Scenario: Racha

- **WHEN** el miembro tiene sesiones en días consecutivos
- **THEN** la racha muestra el número de días seguidos
- **AND** si hoy aún no entrenó, la racha se cuenta desde ayer

#### Scenario: Visitas

- **WHEN** el miembro consulta su resumen
- **THEN** las visitas de la semana provienen de sus check-ins

#### Scenario: Volumen

- **WHEN** el miembro tiene sesiones esta semana
- **THEN** se muestra el volumen levantado (peso × repeticiones de series completadas)
- **WHEN** no hay sesiones
- **THEN** se muestra el volumen planeado de la rutina de hoy, etiquetado como planeado
