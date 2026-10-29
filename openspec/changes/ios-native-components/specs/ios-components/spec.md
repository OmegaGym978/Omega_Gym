# Spec Delta

## Purpose

Define el comportamiento y la apariencia de los componentes base de la aplicación con patrones nativos de iOS, manteniendo el acento rojo/coral del proyecto y sin azul de plataforma.

## ADDED Requirements

### Requirement: Botones táctiles y jerarquía

Los botones SHALL ser fáciles de tocar y MUST diferenciar acciones primarias, secundarias y de cabecera.

#### Scenario: Acción principal

- **WHEN** una pantalla muestra una acción principal
- **THEN** el botón es de estilo píldora con el acento de fondo
- **AND** su altura es de al menos 48 px
- **AND** el texto usa el color de contraste del acento vigente

#### Scenario: Acción secundaria

- **WHEN** una pantalla muestra una acción secundaria
- **THEN** el botón usa fondo gris zinc-800, esquinas redondeadas y texto blanco o gris

#### Scenario: Acción de cabecera

- **WHEN** la cabecera ofrece acciones como "Cancelar", "Guardar" o "Nuevo"
- **THEN** se muestran como texto simple en el color de acento, sin fondo

#### Scenario: Interacción táctil

- **WHEN** el usuario presiona un botón
- **THEN** el botón baja su opacidad
- **AND** no se aplican efectos de hover en dispositivos táctiles

### Requirement: Campos de texto nativos

Los campos SHALL tener fondo oscuro, sin borde rígido, esquinas redondeadas y texto legible.

#### Scenario: Campo en reposo

- **WHEN** se muestra un campo de texto
- **THEN** usa fondo zinc-900, sin borde visible y esquinas de al menos 12 px
- **AND** el placeholder es gris medio
- **AND** el texto es de al menos 17 px

#### Scenario: Campo enfocado

- **WHEN** el usuario enfoca un campo
- **THEN** el foco se indica con un anillo en el color de acento

### Requirement: Tarjetas por contraste

Las tarjetas y contenedores SHALL separarse del fondo por contraste de superficie, sin bordes marcados ni sombras.

#### Scenario: Tarjeta estándar

- **WHEN** se muestra una tarjeta
- **THEN** usa fondo zinc-900 y esquinas de 16 px o más
- **AND** no tiene sombra
- **AND** no tiene borde visible

### Requirement: Listas agrupadas

Las listas de navegación y configuración SHALL presentarse como celdas agrupadas con separadores finos.

#### Scenario: Celda de lista

- **WHEN** se muestra una lista agrupada
- **THEN** el contenedor tiene esquinas muy redondeadas
- **AND** las celdas se separan con una línea fina, excepto la última
- **AND** cada celda muestra icono o avatar a la izquierda, título blanco y subtítulo gris
- **AND** muestra un chevron a la derecha cuando navega

#### Scenario: Tablas de datos

- **WHEN** el staff consulta miembros, membresías o pagos en móvil
- **THEN** los registros se muestran como tarjetas independientes, no como una única celda agrupada

### Requirement: Hojas inferiores

Los diálogos y modales SHALL presentarse como hojas que suben desde abajo.

#### Scenario: Abrir un modal

- **WHEN** el usuario abre un diálogo
- **THEN** el panel sube desde la parte inferior de la pantalla
- **AND** sus esquinas superiores son muy redondeadas
- **AND** muestra un indicador de arrastre centrado en la parte superior
- **AND** el contenido es desplazable si excede el alto disponible

### Requirement: Interruptores y marcas de selección

Las opciones de activación SHALL usar interruptores y las selecciones múltiples SHALL usar marcas circulares.

#### Scenario: Interruptor

- **WHEN** una preferencia está activa
- **THEN** el interruptor muestra el acento de fondo y el control a la derecha
- **WHEN** está inactiva
- **THEN** el fondo es gris y el control a la izquierda

#### Scenario: Selección múltiple

- **WHEN** el usuario selecciona un elemento de una lista
- **THEN** aparece una marca circular en el color de acento
- **AND** la fila se resalta sutilmente

### Requirement: Marca y paleta

La interfaz MUST conservar el acento rojo/coral por defecto y MUST NOT usar el azul de iOS como color de interfaz.

#### Scenario: Revisión de color

- **WHEN** se revisa cualquier pantalla
- **THEN** botones, iconos activos, switches y marcas usan el acento del proyecto
- **AND** no aparecen azules de plataforma
