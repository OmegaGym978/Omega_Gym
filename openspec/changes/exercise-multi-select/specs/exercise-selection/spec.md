# Spec Delta

## Purpose

Define cómo se eligen ejercicios del catálogo para una rutina: búsqueda, filtros, selección múltiple y confirmación en bloque, con feedback visual y sin duplicados.

## ADDED Requirements

### Requirement: Búsqueda y filtros del catálogo

El selector SHALL buscar por nombre (incluyendo `name_es`) y MUST permitir filtrar por equipamiento y por grupo muscular de forma independiente y acumulable.

#### Scenario: Buscar un ejercicio por nombre

- **WHEN** el usuario escribe "press" en el buscador
- **THEN** la lista muestra solo ejercicios cuyo nombre o nombre en español contiene "press"
- **AND** el resultado se actualiza con un debounce corto, sin bloquear la escritura

#### Scenario: Filtrar por equipamiento

- **WHEN** el usuario abre el filtro `Todo el equipamiento` y elige "Mancuerna"
- **THEN** el botón muestra la opción activa
- **AND** la lista se limita a ejercicios con `equipment = 'dumbbell'`

#### Scenario: Combinar filtros

- **WHEN** el usuario tiene un equipamiento y un músculo seleccionados y además escribe una búsqueda
- **THEN** la lista aplica los tres criterios a la vez

#### Scenario: Limpiar filtros

- **WHEN** el usuario elige la opción "Todos" en un filtro
- **THEN** ese criterio deja de aplicarse y el botón vuelve a su etiqueta por defecto

### Requirement: Selección múltiple con feedback visual

El selector MUST permitir seleccionar varios ejercicios y SHALL reflejar el estado de selección en la fila y en un contador fijo inferior.

#### Scenario: Seleccionar y deseleccionar filas

- **WHEN** el usuario toca una fila no seleccionada
- **THEN** la fila cambia a un fondo resaltado con acento
- **AND** muestra un checkmark en el color de acento
- **WHEN** el usuario vuelve a tocarla
- **THEN** la fila vuelve a su estado normal y deja de contar

#### Scenario: Contador de selección

- **WHEN** el usuario tiene N ejercicios seleccionados
- **THEN** el botón inferior dice `Agrega 1 ejercicio` si N = 1 o `Agrega N ejercicios` si N > 1
- **AND** con N = 0 el botón está deshabilitado

### Requirement: Sin ejercicios duplicados en la rutina

El selector MUST NOT permitir agregar un ejercicio que ya forma parte de la rutina en edición.

#### Scenario: Intento de duplicado

- **WHEN** el usuario intenta seleccionar un ejercicio que ya está en la rutina
- **THEN** el sistema no lo agrega a la selección
- **AND** muestra un aviso de que ya está incluido

### Requirement: Confirmación en bloque

El selector SHALL devolver únicamente los ejercicios confirmados y MUST descartar la selección al cerrarse sin confirmar.

#### Scenario: Confirmar la selección

- **WHEN** el usuario toca `Agrega N ejercicios`
- **THEN** el selector se cierra
- **AND** la rutina recibe los N ejercicios en el orden en que fueron elegidos

#### Scenario: Cerrar sin confirmar

- **WHEN** el usuario cierra el selector sin tocar el botón inferior
- **THEN** la rutina no recibe cambios

### Requirement: Estados vacíos y errores

El selector MUST comunicar cuando no hay resultados y cuando la consulta falla, sin dejar la pantalla en blanco.

#### Scenario: Sin resultados

- **WHEN** la búsqueda o los filtros no devuelven ejercicios
- **THEN** se muestra un mensaje de "sin resultados" dentro de la lista

#### Scenario: Error de carga

- **WHEN** la consulta al catálogo falla
- **THEN** se muestra un mensaje de error con opción de reintentar
