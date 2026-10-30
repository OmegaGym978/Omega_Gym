# Spec Delta

## Purpose

Define la pantalla principal de entrenamiento del miembro: listado de rutinas en formato móvil, inicio de una sesión de entrenamiento local y navegación inferior con la pestaña activa resaltada.

## ADDED Requirements

### Requirement: Entrenamiento como sección principal de rutinas del miembro

El sistema SHALL ofrecer la pantalla `Entrenamiento` como la sección dedicada a las rutinas propias del miembro, accesible desde la barra inferior.

#### Scenario: Inicio de sesión del miembro

- **WHEN** un miembro inicia sesión o abre la raíz de la aplicación
- **THEN** el sistema lo lleva a la pantalla `Inicio` (`/my-plan`)
- **AND** la pestaña `Inicio` de la barra inferior aparece activa
- **WHEN** el miembro toca la pestaña `Entrenamiento`
- **THEN** el sistema muestra sus rutinas propias

### Requirement: Listado de rutinas en lista apilada

La pantalla MUST mostrar las rutinas propias como una lista vertical de tarjetas, con el título en negrita y un resumen de ejercicios en una sola línea.

#### Scenario: Rutina con ejercicios

- **WHEN** el miembro abre `Entrenamiento` y tiene rutinas con ejercicios
- **THEN** cada rutina se muestra en una tarjeta de fondo oscuro con bordes muy redondeados
- **AND** el título aparece en negrita
- **AND** debajo se muestran los nombres de ejercicios truncados a una línea en texto gris
- **AND** la tarjeta incluye el total de ejercicios

#### Scenario: Rutina sin ejercicios

- **WHEN** una rutina no tiene ejercicios
- **THEN** la tarjeta indica que aún no tiene ejercicios
- **AND** el botón para entrenar permanece visible pero deshabilitado

#### Scenario: Sin rutinas

- **WHEN** el miembro no tiene rutinas propias
- **THEN** se muestra un estado vacío con la acción de crear la primera rutina y la de importar por código

### Requirement: Acción de empezar rutina

Cada tarjeta SHALL incluir una acción primaria de ancho completo, en el color de acento, para iniciar la rutina.

#### Scenario: Iniciar una rutina

- **WHEN** el miembro toca `Empezar rutina`
- **THEN** se abre la sesión de entrenamiento con los ejercicios de esa rutina
- **AND** se indica que el progreso no se guarda todavía

### Requirement: Sesión de entrenamiento local

La sesión SHALL permitir marcar series por ejercicio y MUST NOT modificar datos del servidor en esta versión.

#### Scenario: Marcar series

- **WHEN** el miembro toca una serie de un ejercicio
- **THEN** la serie queda marcada y el progreso de la sesión avanza
- **AND** al volver a tocarla se desmarca

#### Scenario: Finalizar la sesión

- **WHEN** el miembro finaliza la sesión
- **THEN** la sesión se cierra
- **AND** se informa que el entrenamiento no se guardó

### Requirement: Acciones de gestión de la rutina

La pantalla MUST conservar las acciones existentes sobre cada rutina, agrupadas para no romper el diseño móvil.

#### Scenario: Abrir el menú de acciones

- **WHEN** el miembro abre el menú de una rutina
- **THEN** puede editar, compartir por código, cambiar su visibilidad en Mi plan y eliminarla
- **AND** la eliminación requiere confirmación

### Requirement: Navegación inferior con pestaña activa

La barra inferior SHALL usar el fondo más oscuro del tema y MUST resaltar la pestaña activa en el acento del proyecto.

#### Scenario: Cambiar de pestaña

- **WHEN** el miembro navega entre `Entrenamiento`, `Mi plan`, `Membresía` y `Perfil`
- **THEN** la pestaña activa se muestra en color de acento con su indicador
- **AND** las demás permanecen en gris
- **AND** la etiqueta de cada pestaña se mantiene legible en pantallas de 360 px

### Requirement: Rutinas asignadas por el entrenador

La pantalla SHALL seguir mostrando las rutinas asignadas por el entrenador, separadas de las propias y con su preferencia de visibilidad.

#### Scenario: Ver una rutina asignada

- **WHEN** el miembro tiene rutinas asignadas y visibles
- **THEN** aparecen en una sección propia con el mismo formato de tarjeta
- **AND** puede iniciar la sesión igual que con sus rutinas propias
- **AND** puede alternar su visibilidad en Mi plan
