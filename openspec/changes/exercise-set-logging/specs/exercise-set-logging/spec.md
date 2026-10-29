# Spec Delta

## Purpose

Define la planificación de series por ejercicio dentro del builder de rutinas: cabecera del ejercicio, acciones rápidas, tabla de series con peso y repeticiones, y persistencia compatible con las vistas existentes.

## ADDED Requirements

### Requirement: Tarjeta de ejercicio con cabecera y menú

Cada ejercicio agregado al builder SHALL mostrarse como una tarjeta con imagen circular, nombre y un menú de opciones.

#### Scenario: Cabecera del ejercicio

- **WHEN** el usuario agrega un ejercicio a la rutina
- **THEN** la tarjeta muestra la imagen circular del ejercicio a la izquierda
- **AND** el nombre en texto blanco a su lado
- **AND** un botón de tres puntos verticales a la derecha

#### Scenario: Acciones del menú

- **WHEN** el usuario abre el menú de un ejercicio
- **THEN** puede moverlo arriba o abajo, editar su enlace de referencia o quitarlo
- **AND** "Mover arriba" está deshabilitado en el primer ejercicio y "Mover abajo" en el último

### Requirement: Acciones rápidas de descanso y nota

Cada tarjeta SHALL incluir dos acciones tipo píldora con fondo gris oscuro: descanso y nota.

#### Scenario: Configurar el descanso

- **WHEN** el usuario toca `Descanso: --`
- **THEN** se abre una hoja con opciones de segundos y un campo personalizado
- **AND** al elegir un valor la píldora muestra `Descanso: Ns`
- **AND** el valor se guarda en el ejercicio

#### Scenario: Agregar una nota

- **WHEN** el usuario toca `Nota`
- **THEN** se abre una hoja con un campo de texto
- **AND** al guardar, la nota queda asociada al ejercicio
- **AND** la píldora muestra un indicador cuando hay nota

### Requirement: Tabla de series por ejercicio

La tarjeta SHALL mostrar un encabezado con `SERIE`, `KGS` y `REPS`, y una fila por serie con su número e inputs de peso y repeticiones.

#### Scenario: Estado inicial de un ejercicio

- **WHEN** el usuario agrega un ejercicio
- **THEN** se crea una serie con el peso vacío y las repeticiones en 12

#### Scenario: Editar una serie

- **WHEN** el usuario escribe en el peso o en las repeticiones de una fila
- **THEN** el valor se conserva en el estado del builder
- **AND** los campos aceptan vacío y números decimales en el peso

#### Scenario: Agregar una serie

- **WHEN** el usuario toca `+ Agregar serie`
- **THEN** se añade una fila al final copiando peso y repeticiones de la última serie
- **AND** la numeración se recalcula

#### Scenario: Eliminar una serie

- **WHEN** el usuario elimina una serie
- **THEN** la fila desaparece y la numeración se recalcula
- **AND** no se permite dejar el ejercicio sin series

### Requirement: Persistencia y compatibilidad

El sistema MUST guardar las series en `plan_exercises.set_details` y SHALL mantener los agregados `sets` y `reps` para el resto de la aplicación.

#### Scenario: Guardar una rutina con series

- **WHEN** el usuario guarda la rutina
- **THEN** cada ejercicio guarda su arreglo de series con peso y repeticiones
- **AND** `sets` es igual al número de series guardadas
- **AND** `reps` toma el valor de la primera serie con repeticiones

#### Scenario: Reabrir la rutina

- **WHEN** el usuario vuelve a editar la rutina
- **THEN** las series se muestran con sus pesos y repeticiones guardados

#### Scenario: Rutina anterior al cambio

- **WHEN** se edita una rutina sin series detalladas
- **THEN** el builder genera filas a partir de `sets` y `reps`
- **AND** al guardar, la rutina queda con series detalladas

#### Scenario: Vistas agregadas

- **WHEN** el miembro abre Mi plan o el staff abre el detalle de un plan
- **THEN** se sigue mostrando el resumen de series y repeticiones del ejercicio

### Requirement: Validación de series

El builder MUST evitar guardar series ambiguas.

#### Scenario: Peso sin repeticiones

- **WHEN** una serie tiene peso pero no repeticiones
- **THEN** el guardado se bloquea con un aviso
- **AND** la rutina no se modifica

#### Scenario: Series vacías

- **WHEN** una serie no tiene peso ni repeticiones
- **THEN** se descarta al guardar
- **AND** si todas están vacías, el ejercicio queda sin series (`sets = 0`)

### Requirement: Compartir e importar conserva las series

La importación por código SHALL copiar el detalle de series de la rutina original.

#### Scenario: Importar una rutina compartida

- **WHEN** un miembro importa una rutina por código
- **THEN** la copia conserva peso y repeticiones de cada serie
