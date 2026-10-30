# Spec Delta

## Purpose

Define la creación y edición de rutinas y planes de entrenamiento en una sola pantalla, sin reparto por días de la semana, incluyendo el alta de ejercicios en bloque y su configuración por fila.

## ADDED Requirements

### Requirement: Edición en una sola pantalla

El builder SHALL presentar título, ejercicios y acciones de guardado en una única vista vertical, sin pasos ni pestañas intermedias.

#### Scenario: Abrir el builder en modo creación

- **WHEN** el usuario toca "Nueva rutina" (miembro) o "Nuevo plan" (staff)
- **THEN** se abre una sola pantalla con el título vacío y el estado vacío de ejercicios
- **AND** el header muestra `Cancelar`, `Crear rutina` y `Guardar`

#### Scenario: Abrir el builder en modo edición

- **WHEN** el usuario edita una rutina existente
- **THEN** el título y los ejercicios se cargan en la misma pantalla
- **AND** el header muestra `Cancelar`, `Editar rutina` y `Guardar`

### Requirement: Título de la rutina

El builder SHALL usar un campo de título sin bordes ni fondo propio, con tipografía destacada, y MUST exigir un título no vacío para guardar.

#### Scenario: Guardar sin título

- **WHEN** el usuario intenta guardar con el título vacío
- **THEN** la acción de guardar no está disponible
- **AND** se indica que el título es obligatorio

#### Scenario: Guardar sin ejercicios

- **WHEN** el usuario guarda con título y cero ejercicios
- **THEN** el sistema pide confirmación antes de crear o actualizar la rutina

### Requirement: Alta de ejercicios en bloque

El builder MUST permitir agregar varios ejercicios desde el selector múltiple y SHALL asignarles valores por defecto editables.

#### Scenario: Agregar varios ejercicios

- **WHEN** el usuario confirma N ejercicios en el selector
- **THEN** se agregan N filas al final de la lista
- **AND** cada fila queda con 3 series y 12 repeticiones por defecto
- **AND** el enlace de referencia se toma del GIF del catálogo cuando existe

#### Scenario: Configurar un ejercicio

- **WHEN** el usuario toca una fila de ejercicio
- **THEN** se abre una hoja inferior con series, repeticiones, notas y enlace
- **AND** al confirmar, los valores de esa fila se actualizan en la lista

#### Scenario: Reordenar y eliminar

- **WHEN** el usuario usa las flechas de una fila
- **THEN** el ejercicio cambia de posición y el orden se conserva al guardar
- **WHEN** el usuario elimina una fila
- **THEN** el ejercicio desaparece de la lista antes de guardar

### Requirement: Sin reparto por días de la semana

El sistema MUST NOT solicitar ni mostrar días de la semana al crear o editar una rutina o plan, y las vistas de consulta SHALL mostrar los ejercicios como una lista única.

#### Scenario: El builder no pide días

- **WHEN** el usuario crea o edita una rutina
- **THEN** no aparece ningún selector de días de la semana

#### Scenario: Guardar una rutina

- **WHEN** el usuario guarda la rutina
- **THEN** los ejercicios se almacenan sin día asignado (`day = null`)
- **AND** el orden visible queda determinado por el orden de la lista

#### Scenario: Consultar el plan en "Mi plan"

- **WHEN** el miembro abre "Mi plan"
- **THEN** ve la lista completa de ejercicios del plan activo
- **AND** no hay pestañas de lunes a domingo

#### Scenario: Consultar el detalle del panel de staff

- **WHEN** el staff selecciona un plan en `/training-plans`
- **THEN** el detalle muestra una lista plana de ejercicios
- **AND** no se muestra el reparto semanal ni el indicador de días

### Requirement: Salida segura del builder

El builder MUST advertir cuando se intenta cerrar con cambios sin guardar.

#### Scenario: Cancelar con cambios

- **WHEN** el usuario toca `Cancelar` después de modificar el título o los ejercicios
- **THEN** el sistema pide confirmación antes de descartar los cambios

#### Scenario: Cancelar sin cambios

- **WHEN** el usuario toca `Cancelar` sin haber modificado nada
- **THEN** el builder se cierra directamente
