# Spec Delta

## Purpose

Define el perfil del miembro con estructura móvil: identidad, estadísticas compactas, actividad y accesos directos, usando el acento rojo/coral del proyecto como único color de resalte.

## ADDED Requirements

### Requirement: Cabecera compacta del perfil

La pantalla MUST mostrar el nombre del miembro alineado a la izquierda y las acciones de edición, compartir y ajustes como iconos a la derecha, sin breadcrumb.

#### Scenario: Abrir el perfil

- **WHEN** el miembro abre `Perfil`
- **THEN** el nombre aparece en la parte superior izquierda
- **AND** a la derecha se muestran los iconos de editar, compartir y ajustes
- **AND** no se muestra ninguna miga de pan

#### Scenario: Editar el perfil

- **WHEN** el miembro toca el icono de lápiz
- **THEN** se abre el modal de edición con nombre y teléfono
- **AND** guardar mantiene la validación de nombre obligatorio y teléfono de 10 dígitos

#### Scenario: Abrir ajustes

- **WHEN** el miembro toca el icono de engranaje
- **THEN** se abre el modal de ajustes con el cambio de tema y la opción de cerrar sesión

#### Scenario: Compartir el perfil

- **WHEN** el miembro toca el icono de compartir y el navegador soporta `navigator.share`
- **THEN** se abre la hoja de compartir del sistema
- **WHEN** no lo soporta
- **THEN** el enlace se copia al portapapeles y se confirma con un aviso

### Requirement: Identidad y estadísticas

La pantalla SHALL mostrar el avatar circular a la izquierda y, a su derecha, el nombre con tres estadísticas compactas.

#### Scenario: Ver estadísticas

- **WHEN** el miembro abre su perfil
- **THEN** ve su avatar y su nombre
- **AND** debajo del nombre ve tres estadísticas: meses como miembro, visitas registradas y entrenamientos
- **AND** la estadística de entrenamientos muestra 0 mientras no exista registro de sesiones

### Requirement: Tarjeta de actividad

La pantalla MUST incluir una tarjeta de gráfico con píldoras de métrica y SHALL mostrar un estado vacío explícito cuando no haya datos.

#### Scenario: Con visitas registradas

- **WHEN** el miembro tiene check-ins en los últimos seis meses
- **THEN** la píldora `Visitas` está activa por defecto
- **AND** la tarjeta muestra barras con las visitas por mes

#### Scenario: Sin visitas registradas

- **WHEN** el miembro no tiene check-ins
- **THEN** la tarjeta muestra un icono de barras centrado y el texto `Aún no hay datos`

#### Scenario: Métricas sin fuente de datos

- **WHEN** el miembro selecciona `Duración`, `Volumen` o `Repeticiones`
- **THEN** la píldora activa se pinta en el acento
- **AND** la tarjeta muestra `Aún no hay datos`

### Requirement: Accesos directos en cuadrícula

La pantalla SHALL organizar los accesos de información en una cuadrícula de 2×2 con fondo oscuro, bordes muy redondeados, texto blanco e icono a la izquierda.

#### Scenario: Navegar a la asistencia

- **WHEN** el miembro toca `Calendario`
- **THEN** el sistema navega a la pantalla de asistencias del miembro

#### Scenario: Accesos sin pantalla disponible

- **WHEN** el miembro toca `Estadísticas`, `Ejercicios` o `Medidas`
- **THEN** el sistema informa que la sección estará disponible próximamente
- **AND** no se navega a una ruta inexistente

### Requirement: Paleta del proyecto

La pantalla MUST usar el acento rojo/coral y los tokens del tema como únicos colores de resalte, sin azules ni colores literales de otras plataformas.

#### Scenario: Revisión de color

- **WHEN** se revisa el perfil en tema oscuro y en tema claro
- **THEN** los elementos activos, iconos resaltados y acciones usan el acento del proyecto
- **AND** no aparecen azules hardcodeados

### Requirement: Navegación inferior activa

La barra inferior MUST resaltar la pestaña `Perfil` en el acento del proyecto sobre la base más oscura del tema.

#### Scenario: Perfil activo

- **WHEN** el miembro está en la pantalla `Perfil`
- **THEN** la pestaña `Perfil` aparece en color de acento con su icono resaltado
- **AND** el fondo de la barra corresponde al negro/gris más oscuro del tema
