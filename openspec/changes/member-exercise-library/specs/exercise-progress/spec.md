# Spec Delta

## Purpose

Define el progreso por ejercicio a partir de las sesiones registradas: gráfico, récords personales e historial.

## ADDED Requirements

### Requirement: Progreso por ejercicio

El detalle SHALL mostrar el progreso del ejercicio calculado desde las series completadas del miembro.

#### Scenario: Con sesiones registradas

- **WHEN** el miembro tiene series completadas de ese ejercicio
- **THEN** la tarjeta de progreso muestra una barra por sesión
- **AND** se puede alternar entre `Mayor Peso`, `1RM` y `Mejor Volumen`
- **AND** la métrica activa se muestra con el acento del proyecto

#### Scenario: Sin sesiones

- **WHEN** el miembro no tiene series de ese ejercicio
- **THEN** la tarjeta muestra un icono de barras y el texto `Aún no hay datos`

### Requirement: Récords personales

El detalle SHALL mostrar los récords del ejercicio.

#### Scenario: Valores

- **WHEN** existen series registradas
- **THEN** `Mayor Peso` muestra el peso máximo levantado
- **AND** `Mejor 1RM` muestra la mejor estimación de una repetición máxima
- **AND** si no hay datos, ambos muestran `—`

### Requirement: Historial del ejercicio

La pestaña Historial SHALL listar las sesiones donde aparece el ejercicio.

#### Scenario: Sesiones

- **WHEN** el miembro abre Historial con datos
- **THEN** cada fila muestra la fecha, el número de series y el volumen
- **AND** muestra el peso máximo de esa sesión

#### Scenario: Sin historial

- **WHEN** no hay sesiones con ese ejercicio
- **THEN** se muestra un estado vacío invitando a registrar una sesión

### Requirement: Privacidad

El progreso MUST calcularse solo con las sesiones del miembro autenticado.

#### Scenario: Datos ajenos

- **WHEN** se consultan series de sesiones de otro miembro
- **THEN** no se incluyen en el progreso ni en el historial
