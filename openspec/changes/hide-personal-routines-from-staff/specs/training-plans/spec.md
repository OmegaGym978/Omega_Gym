# Spec Delta

## Purpose

Define el alcance de acceso a los planes de entrenamiento y a sus ejercicios según el rol de la persona y el tipo de plan (`trainer` o `personal`), garantizando que las rutinas personales de los miembros no sean accesibles para el staff.

## ADDED Requirements

### Requirement: Lectura del staff limitada a planes de entrenamiento

El staff (roles `admin` y `trainer`) SHALL poder leer únicamente planes con `kind = 'trainer'` y los ejercicios asociados. Las rutinas personales (`kind = 'personal'`) de los miembros MUST quedar fuera de su alcance, tanto en la aplicación como en cualquier consulta directa a la API.

#### Scenario: El staff lista planes en el panel

- **WHEN** un usuario con rol `admin` o `trainer` abre `/training-plans`
- **THEN** el sistema muestra solo planes `kind = 'trainer'`
- **AND** el total listado coincide con los planes de entrenamiento existentes, sin contar rutinas personales

#### Scenario: El staff consulta rutinas personales por API

- **WHEN** un usuario con rol `admin` o `trainer` consulta la API filtrando `kind = 'personal'`
- **THEN** el sistema devuelve una lista vacía
- **AND** no se expone ningún dato de la rutina personal

#### Scenario: El staff intenta leer ejercicios de una rutina personal

- **WHEN** un usuario con rol `admin` o `trainer` solicita los ejercicios de un plan `kind = 'personal'` cuyo identificador conoce
- **THEN** el sistema devuelve una lista vacía

### Requirement: El staff no modifica rutinas personales de miembros

El staff MUST NOT poder crear, actualizar ni eliminar planes `kind = 'personal'` ni sus ejercicios a través de la API. Su capacidad de escritura SHALL limitarse a planes `kind = 'trainer'`.

#### Scenario: El staff intenta actualizar o eliminar una rutina personal

- **WHEN** un usuario con rol `admin` o `trainer` ejecuta una actualización o eliminación sobre un plan `kind = 'personal'`
- **THEN** el sistema no modifica ninguna fila
- **AND** la rutina personal permanece intacta

#### Scenario: El staff intenta modificar ejercicios de una rutina personal

- **WHEN** un usuario con rol `admin` o `trainer` intenta insertar, actualizar o eliminar ejercicios de un plan `kind = 'personal'`
- **THEN** el sistema no aplica el cambio

#### Scenario: El flujo del staff sobre planes de entrenamiento sigue disponible

- **WHEN** un usuario con rol `admin` o `trainer` crea un plan, edita sus ejercicios y luego lo elimina
- **THEN** todas las operaciones se completan correctamente

### Requirement: El miembro conserva el acceso a sus propias rutinas personales

Un miembro SHALL seguir leyendo y editando sus propias rutinas personales y los ejercicios asociados, con independencia de las restricciones aplicadas al staff.

#### Scenario: El dueño consulta y edita su rutina personal

- **WHEN** un miembro abre "Mis rutinas"
- **THEN** ve sus rutinas personales y sus ejercicios
- **AND** puede editarlas, compartirlas por código y cambiar su visibilidad en "Mi plan"

#### Scenario: Un miembro ajeno no accede a la rutina personal

- **WHEN** un miembro consulta una rutina personal que pertenece a otro miembro
- **THEN** el sistema no le devuelve la rutina ni sus ejercicios

### Requirement: El panel de planes opera solo sobre planes de entrenamiento

El panel de staff SHALL listar y operar exclusivamente sobre planes `kind = 'trainer'`, y toda copia generada desde él MUST conservar ese tipo.

#### Scenario: Duplicar un plan desde el panel

- **WHEN** un usuario con rol `admin` o `trainer` duplica un plan
- **THEN** la copia se crea con `kind = 'trainer'`
- **AND** queda visible en el panel

#### Scenario: Rutinas personales no alteran las métricas del panel

- **WHEN** existen rutinas personales de miembros
- **THEN** los indicadores "Planes totales" y "Asignados" del panel no las contabilizan
