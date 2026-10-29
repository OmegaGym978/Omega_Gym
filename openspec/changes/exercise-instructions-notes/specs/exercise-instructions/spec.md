# Spec Delta

## Purpose

Define la presentación de las instrucciones de un ejercicio como pasos numerados y la composición del detalle con imagen y título siempre visibles.

## ADDED Requirements

### Requirement: Área superior visible en todas las pestañas

El detalle SHALL mostrar la imagen o GIF y el título del ejercicio por encima de las pestañas.

#### Scenario: Cambiar de pestaña

- **WHEN** el miembro alterna entre `Resumen`, `Historial` e `Indicaciones`
- **THEN** la imagen y el título permanecen visibles
- **AND** `Resumen` comienza en la tarjeta de progreso

#### Scenario: Ejercicio sin imagen

- **WHEN** el ejercicio no tiene GIF ni imagen
- **THEN** se muestra un contenedor con un icono genérico

### Requirement: Instrucciones como pasos numerados

La pestaña `Indicaciones` SHALL dividir el texto en pasos y renderizarlos como una lista numerada.

#### Scenario: Instrucciones en un párrafo

- **WHEN** el texto llega como un párrafo con oraciones separadas por punto
- **THEN** se divide en pasos por fin de oración
- **AND** cada paso se muestra con su número a la izquierda
- **AND** el número usa el acento del proyecto

#### Scenario: Instrucciones con saltos o numeración

- **WHEN** el texto ya tiene líneas o una numeración inline
- **THEN** se respeta esa división y se elimina la numeración original

#### Scenario: Legibilidad

- **WHEN** se muestran los pasos
- **THEN** hay separación amplia entre pasos
- **AND** el texto usa interlineado relajado en gris claro

#### Scenario: Sin instrucciones

- **WHEN** el ejercicio no tiene indicaciones
- **THEN** se muestra un estado vacío

### Requirement: Imagen y título sin duplicación

El detalle MUST NOT repetir el bloque de imagen y título dentro de `Resumen`.

#### Scenario: Composición

- **WHEN** el miembro abre `Resumen`
- **THEN** el bloque visual aparece una sola vez, sobre las pestañas
- **AND** el contenido de la pestaña empieza en el progreso
