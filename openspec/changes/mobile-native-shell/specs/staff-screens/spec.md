# Spec Delta

## Purpose

Define la presentación móvil de las pantallas de gestión del staff: dashboard, listados con tabla, ficha de miembro, huella y planes de entrenamiento.

## ADDED Requirements

### Requirement: Listados adaptados a móvil

Las pantallas con tabla SHALL mostrar tarjetas apiladas en móvil y MUST conservar la tabla en escritorio dentro de un contenedor redondeado.

#### Scenario: Listado en móvil

- **WHEN** el staff abre miembros, membresías o pagos en un dispositivo móvil
- **THEN** cada registro se muestra como una tarjeta redondeada e independiente
- **AND** los campos principales aparecen en una cuadrícula de dos columnas

#### Scenario: Listado en escritorio

- **WHEN** el mismo listado se abre en escritorio
- **THEN** se muestra la tabla completa dentro de un contenedor con esquinas redondeadas

### Requirement: Dashboard móvil

El dashboard SHALL presentar los indicadores en una cuadrícula de dos columnas y las secciones apiladas, sin paneles laterales.

#### Scenario: Ver indicadores

- **WHEN** el staff abre el inicio
- **THEN** ve los KPIs en tarjetas redondeadas de dos columnas
- **AND** las listas de actividad y pagos pendientes se apilan debajo

### Requirement: Detalle de miembro con retorno explícito

La ficha del miembro MUST mostrar una acción de volver al listado de miembros y SHALL usar la cabecera única de pantalla.

#### Scenario: Volver al listado

- **WHEN** el staff abre la ficha de un miembro
- **THEN** la cabecera muestra el nombre y un botón de volver
- **AND** al tocarlo regresa al listado de miembros

### Requirement: Planes de entrenamiento móviles

La pantalla de planes SHALL mostrar una lista apilada y MUST abrir el detalle a pantalla completa, conservando las acciones de asignar, quitar asignación, duplicar, editar y eliminar.

#### Scenario: Abrir un plan

- **WHEN** el staff toca un plan en la lista
- **THEN** se abre el detalle a pantalla completa con nombre, creador, asignados y ejercicios

#### Scenario: Asignar miembros

- **WHEN** el staff toca "Asignar" en el detalle
- **THEN** se abre un selector múltiple de miembros
- **AND** al confirmar, los miembros aparecen en la lista de asignados

#### Scenario: Ver un ejercicio

- **WHEN** el staff toca un ejercicio del plan
- **THEN** se abre su detalle con imagen, etiquetas, instrucciones y notas

#### Scenario: Eliminar un plan

- **WHEN** el staff elimina un plan
- **THEN** el sistema pide confirmación
- **AND** al confirmar se elimina el plan y sus ejercicios

### Requirement: Autenticación y kiosko coherentes

Las pantallas de autenticación y el kiosko de check-in SHALL usar el mismo lenguaje visual (negro puro, tarjetas redondeadas, botones píldora) sin alterar su funcionamiento.

#### Scenario: Iniciar sesión en móvil

- **WHEN** el usuario abre el inicio de sesión en móvil
- **THEN** los campos no provocan zoom y el botón principal es una píldora de acento

#### Scenario: Kiosko de check-in

- **WHEN** el kiosko se abre en el equipo del gym
- **THEN** mantiene su pantalla completa sobre negro puro
- **AND** el sensor y los mensajes de estado siguen funcionando igual
