# Spec Delta

## Purpose

Define la exploración y creación de ejercicios para el miembro: lista con búsqueda y filtros, celdas nativas, creación de ejercicios personales y detalle por pestañas.

## ADDED Requirements

### Requirement: Lista de ejercicios

El miembro SHALL acceder a una lista de ejercicios del catálogo y de sus ejercicios personales.

#### Scenario: Abrir la lista

- **WHEN** el miembro toca "Ejercicios" en su Perfil
- **THEN** se abre una pantalla con volver, título centrado y acción `Crear`
- **AND** se muestra el buscador y los filtros `Todo el Equipamiento` y `Todos los Músculos`

#### Scenario: Buscar y filtrar

- **WHEN** el miembro escribe o elige un filtro
- **THEN** la lista se actualiza y mantiene la paginación
- **AND** si no hay resultados se muestra un estado vacío

#### Scenario: Celdas de la lista

- **WHEN** se muestra cada ejercicio
- **THEN** aparece una imagen circular a la izquierda
- **AND** el nombre en blanco y el grupo muscular en gris
- **AND** un chevron a la derecha y un separador fino entre filas

### Requirement: Ejercicios personales

El miembro SHALL poder crear ejercicios propios que solo él ve.

#### Scenario: Crear un ejercicio

- **WHEN** el miembro toca `Crear` y completa nombre, músculo y equipamiento
- **THEN** el ejercicio se guarda en su catálogo personal
- **AND** aparece en la lista y en el selector de ejercicios de sus rutinas

#### Scenario: Visibilidad

- **WHEN** otro miembro consulta el catálogo
- **THEN** no ve los ejercicios personales ajenos
- **AND** el catálogo global sigue visible para todos

### Requirement: Detalle del ejercicio

El miembro SHALL ver el detalle de un ejercicio con pestañas.

#### Scenario: Resumen

- **WHEN** el miembro abre un ejercicio
- **THEN** ve la imagen o GIF a ancho completo, el nombre y el músculo principal
- **AND** ve la tarjeta de progreso, las métricas y sus récords personales

#### Scenario: Historial

- **WHEN** el miembro abre la pestaña Historial
- **THEN** ve las sesiones donde aparece el ejercicio con fecha, series, volumen y peso máximo
- **AND** si no hay sesiones se muestra un estado vacío

#### Scenario: Indicaciones

- **WHEN** el miembro abre la pestaña Indicaciones
- **THEN** ve las instrucciones del catálogo o un estado vacío

### Requirement: Acciones del detalle

El detalle SHALL permitir compartir, agregar a una rutina y eliminar ejercicios personales.

#### Scenario: Compartir

- **WHEN** el miembro toca el icono de compartir
- **THEN** se abre la hoja del sistema o se copia el enlace al portapapeles

#### Scenario: Agregar a una rutina

- **WHEN** el miembro elige `Agregar a una rutina` y selecciona una rutina propia
- **THEN** el ejercicio se agrega con una serie de 12 repeticiones

#### Scenario: Eliminar un ejercicio personal

- **WHEN** el miembro elimina un ejercicio propio y confirma
- **THEN** el ejercicio desaparece de su catálogo
- **AND** las rutinas que lo usaban conservan su nombre y no se rompen
