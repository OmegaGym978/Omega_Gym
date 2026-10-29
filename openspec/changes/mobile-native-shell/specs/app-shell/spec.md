# Spec Delta

## Purpose

Define el shell de navegación de la aplicación: barra inferior por rol, hoja "Más", drawer bajo demanda y cabecera de pantalla, sin barras laterales fijas ni breadcrumbs.

## ADDED Requirements

### Requirement: Barra inferior con pestañas por rol

La aplicación SHALL mostrar una barra de navegación inferior fija con las secciones principales de cada rol y MUST resaltar la pestaña activa con el acento del proyecto.

#### Scenario: Navegación del miembro

- **WHEN** un miembro inicia sesión
- **THEN** la barra inferior muestra `Inicio`, `Entrenamiento`, `Perfil` y `Más`
- **AND** la pestaña activa se muestra en el color de acento

#### Scenario: Navegación del administrador

- **WHEN** un administrador inicia sesión
- **THEN** la barra inferior muestra `Inicio`, `Miembros`, `Pagos`, `Perfil` y `Más`

#### Scenario: Navegación del entrenador

- **WHEN** un entrenador inicia sesión
- **THEN** la barra inferior muestra `Inicio`, `Miembros`, `Membresías`, `Perfil` y `Más`
- **AND** no se ofrece la sección de pagos, que es exclusiva del administrador

#### Scenario: Pestaña activa en una subruta

- **WHEN** el usuario está en `/members/:id`
- **THEN** la pestaña `Miembros` aparece activa

### Requirement: Hoja "Más" para secciones secundarias

La barra inferior SHALL ofrecer una acción `Más` que abra una hoja con el resto de secciones del rol y el acceso a Ajustes.

#### Scenario: Abrir Más

- **WHEN** el usuario toca `Más`
- **THEN** se abre una hoja inferior con las secciones no visibles en la barra
- **AND** cada sección navega a su ruta y cierra la hoja
- **AND** la hoja incluye una acción de Ajustes

#### Scenario: Sección secundaria activa

- **WHEN** el usuario navega a una sección que vive en `Más`
- **THEN** la acción `Más` se muestra como activa en el acento

### Requirement: Drawer bajo demanda

El staff SHALL acceder al menú completo desde la cabecera; la aplicación MUST NOT mostrar una barra lateral fija ni un rail permanente.

#### Scenario: Abrir el menú

- **WHEN** un usuario de staff toca el botón de menú de la cabecera
- **THEN** se abre un drawer lateral con el perfil, todas las secciones y Ajustes
- **AND** al elegir una sección el drawer se cierra y navega

#### Scenario: Sin barras laterales fijas

- **WHEN** la aplicación se abre en escritorio
- **THEN** no existe una columna de navegación permanente
- **AND** la navegación se resuelve con la barra inferior y el drawer

### Requirement: Cabecera de pantalla única

Cada pantalla SHALL usar una cabecera con título, subtítulo opcional, acción de volver o menú y acciones, y MUST NOT mostrar breadcrumbs.

#### Scenario: Cabecera con acciones

- **WHEN** el usuario abre una pantalla de listado
- **THEN** la cabecera muestra el título y las acciones principales (por ejemplo, "Nuevo miembro")
- **AND** no se muestran migas de pan

#### Scenario: Volver desde un detalle

- **WHEN** el usuario abre un detalle con origen conocido
- **THEN** la cabecera muestra un botón de volver que regresa al listado

### Requirement: Layouts centrados y adaptativos

Las vistas de miembro y autenticación SHALL usar una columna centrada tipo app móvil; las vistas de staff SHALL usar un contenedor más amplio en escritorio sin perder la jerarquía móvil.

#### Scenario: Vista de miembro en escritorio

- **WHEN** un miembro abre `Entrenamiento` o `Perfil` en escritorio
- **THEN** el contenido aparece centrado en una columna de aproximadamente 560 px

#### Scenario: Vista de staff en escritorio

- **WHEN** el staff abre un listado en escritorio
- **THEN** el contenido usa un contenedor de hasta 1100 px
- **AND** en móvil se apila en una sola columna
