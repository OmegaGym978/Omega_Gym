# Spec Delta

## Purpose

Define los tokens visuales y las variantes base de componentes: superficies, texto, radios, acento intercambiable y controles nativos.

## ADDED Requirements

### Requirement: Superficies oscuras y contraste

En modo oscuro el fondo de la aplicación SHALL ser negro puro y las tarjetas, modales y contenedores secundarios MUST usar la escala de grises del tema.

#### Scenario: Fondo y tarjetas

- **WHEN** la aplicación se muestra en modo oscuro
- **THEN** el fondo principal es negro puro
- **AND** las tarjetas usan la superficie oscura del tema, con borde sutil

#### Scenario: Tema claro

- **WHEN** el usuario activa el tema claro
- **THEN** los neutros cambian a la escala clara
- **AND** el acento elegido se conserva

### Requirement: Acento intercambiable

El sistema SHALL permitir cambiar el color de acento entre presets y MUST usar el rojo/coral como valor por defecto. Todos los elementos activos, botones, iconos resaltados y checkmarks SHALL usar el acento vigente.

#### Scenario: Cambiar el acento

- **WHEN** el usuario elige otro color en Ajustes
- **THEN** botones, pestañas activas, checkmarks y resaltados cambian sin recargar la aplicación
- **AND** la elección persiste entre sesiones

#### Scenario: Contraste del botón primario

- **WHEN** el acento vigente es claro (lima, ámbar, turquesa o violeta)
- **THEN** el texto del botón primario usa el color de contraste oscuro
- **WHEN** el acento es coral o ember
- **THEN** el texto del botón primario es blanco

#### Scenario: Sin azul de interfaz

- **WHEN** se revisa cualquier pantalla
- **THEN** ningún elemento de interfaz usa azul
- **AND** la información que antes era azul se representa con acento, turquesa o gris

### Requirement: Radios y botones

Los contenedores y tarjetas SHALL usar esquinas muy redondeadas y los botones de acción principales MUST ser de estilo píldora con el acento de fondo.

#### Scenario: Botón primario

- **WHEN** una pantalla muestra una acción principal
- **THEN** el botón es completamente redondeado, con fondo de acento y texto de contraste

#### Scenario: Contenedores

- **WHEN** se muestra una tarjeta, modal o panel
- **THEN** sus esquinas son muy redondeadas (16 px o más)

### Requirement: Campos de entrada nativos

Los campos de texto SHALL tener fondo oscuro o transparente, sin borde marcado, texto legible y foco en el acento. En móvil MUST usar al menos 16 px para evitar el zoom del navegador.

#### Scenario: Enfocar un campo en móvil

- **WHEN** el usuario enfoca un campo de texto en un dispositivo móvil
- **THEN** el campo no provoca zoom de la página
- **AND** el foco se indica con el color de acento

### Requirement: Tipografía y espaciado móvil

La interfaz SHALL priorizar tamaños y espaciados legibles en pantallas de 360 px, evitando paddings laterales excesivos y columnas múltiples en móvil.

#### Scenario: Vista en 360 px

- **WHEN** la aplicación se muestra a 360 px de ancho
- **THEN** el contenido usa una sola columna
- **AND** los textos y botones permanecen legibles sin desbordarse
