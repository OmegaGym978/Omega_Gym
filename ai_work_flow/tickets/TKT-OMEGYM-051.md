# TKT-OMEGYM-051: Vista "Entrenando" — ficha de técnica y corrección de color

## Metadata
- **Tipo**: Feature (UI/UX)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: workout / training
- **Relacionado con**: `SPECIFICATION.md` (§11.4 Planes de Entrenamiento, §14 Estrategia de Componentes)
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-11-02
- **Fecha cierre**: —

## Descripción

En la sesión de entrenamiento (`WorkoutSession`, cabecera "Entrenando") el
encabezado de cada ejercicio era texto plano: no había forma de consultar la
técnica sin salir de la sesión. Además, el botón "Finalizar", el indicador de
porcentaje y los círculos numerados se veían **amarillo/mostaza**, fuera de la
identidad de Omega Gym.

## Diagnóstico del color

Los tres elementos usaban el acento **configurable**, no un color fijo:

| Elemento | Antes |
|---|---|
| Círculo del porcentaje | `bg-accent-dim text-accent` |
| Barra de progreso | `bg-accent` |
| Círculos numerados 1, 2… | `bg-accent-dim text-accent` |
| Botón "Finalizar" | `bg-accent text-accent-contrast` |

`--color-accent` cambia con el preset de **Ajustes → Color de acento**
(`coral`, `ember`, `lime`, `violet`, `pink`, `amber`). Con `amber`
("Amarillo vibrante") o `ember` ("Naranja atardecer") esos cuatro elementos se
ven mostaza. En la misma pantalla había dos fuentes más de amarillo:
el icono del aviso usaba `text-amber-text` y el foco de los inputs,
`ring-accent/40`.

## Decisiones

- **Rojo fijo con tokens, no clases crudas**: se usa `bg-red`, `bg-red-bg`,
  `text-red` y `text-white`. `--color-red` vale `#ef4444`, el mismo valor que
  `red-500`, pero pasa por el tema (claro/oscuro) y por la escala de radios del
  proyecto. Escribir `bg-red-500` a secas funcionaría, pero rompe la convención
  de tokens que ya siguen las demás pantallas.
- **El acento configurable deja de aplicar a los controles de la sesión**: el
  amarillo no es un bug de un componente, es el preset elegido. Fijar el rojo en
  los controles garantiza la identidad de marca en la pantalla de entrenamiento
  aunque el miembro tenga otro acento guardado.
- **`Checkmark` no se toca**: es un átomo compartido con los selectores de
  ejercicios y planes; su color sigue el acento elegido.
- **Ficha de técnica en `BottomSheet`** (inset grouped) con
  `panelClassName="bg-surface rounded-t-sheet"`: `bg-surface` es el equivalente
  de `bg-zinc-900` en los tokens del proyecto, así que respeta el tema claro.
  Se monta dentro del overlay de la sesión (`z-[65]` → hoja `z-[80]`).
- **Datos del catálogo bajo demanda con caché**: `exercisesService.getById(id)`
  se pide la primera vez que se abre cada ejercicio y se guarda en un `Map` por
  `exercise_id`; así abrir/cerrar la ficha varias veces no repite consultas.
  Una petición vieja se descarta con `detailRequest` si el usuario cambia de
  ejercicio mientras carga.
- **Media real cuando existe**: si el catálogo trae `gif_url` o `image_url` se
  muestra; si no, se pinta el placeholder solicitado ("Demostración en camino").
  El hueco ya queda listo para cuando se carguen los GIF.
- **Descripción**: `splitInstructions(instructions_es)` para partir el párrafo
  del catálogo en pasos numerados. Si el catálogo no tiene indicaciones se usa
  `plan_exercises.notes`; si tampoco hay, un texto explicativo.
- **Accesibilidad**: el encabezado es un `<button>` con `aria-haspopup="dialog"`
  y `aria-label` ("Ver técnica de …"), e icono de información `(i)` a la derecha
  como afordancia. El `BottomSheet` cierra con Escape sin cerrar la sesión
  (escucha en fase de captura y corta la propagación).

## Archivos Afectados
- `src/components/workout/WorkoutSession.tsx`

## Implementación
- [x] Encabezado de ejercicio clicable (número + nombre + músculo + icono `(i)`)
- [x] `BottomSheet` con nombre, grupo muscular, equipo, media/placeholder y pasos
- [x] Caché de detalles por `exercise_id` y descarte de respuestas viejas
- [x] `Checkmark` y `sessionsService` intactos
- [x] Porcentaje, barra, círculos, "Finalizar", icono del aviso y foco en rojo

## Criterios de Aceptación
- [x] Tocar el encabezado abre la ficha del ejercicio con su nombre y grupo muscular.
- [x] La ficha muestra cómo ejecutar el movimiento o un mensaje si el catálogo no tiene indicaciones.
- [x] Si no hay GIF/imagen, se ve el placeholder reservado para la demostración.
- [x] El botón "Finalizar", el porcentaje, los círculos numerados y el icono del aviso son rojo/coral, sin amarillo.
- [x] `npm run build` y `npm run lint` pasan sin errores.
- [ ] Validación visual en dispositivo con sesión de miembro (abrir/cerrar ficha, marcar series, finalizar).

## Evidencia

**Fecha**: 2026-11-02
**Probado por**: Agente (build/lint); validación visual pendiente
**Resultado**:
- `npm run build` ✓ 10.5 s, `npm run lint` (`--max-warnings 0`) ✓ sin salida.
- El CSS compilado incluye las utilidades usadas: `.bg-red`, `.bg-red-bg`,
  `.text-red`, `.text-white`, `.bg-surface`, `.bg-white`, `.border-border2`,
  `.rounded-tile`, `.rounded-t-sheet` y el anillo `ring-red/40`.
- `grep amber|accent` en `WorkoutSession.tsx`: sin coincidencias (el acento ya no
  interviene en la sesión).
**Commit**: `feat(workout): ficha de técnica y rojo de marca en la sesión (#TKT-OMEGYM-051)`
