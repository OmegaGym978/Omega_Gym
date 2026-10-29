# TKT-OMEGYM-044: Indicaciones como pasos y área superior común

## Metadata
- **Tipo**: Refactoring (UI)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: exercise-instructions
- **Relacionado con**: `openspec/changes/exercise-instructions-notes/`
- **OpenSpec change**: `exercise-instructions-notes` → capability `exercise-instructions`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
La pestaña `Indicaciones` mostraba el texto del catálogo como un párrafo dentro de una tarjeta, y la imagen/título solo se veían en `Resumen`.

- La imagen/GIF y el título pasan a estar sobre las pestañas y se mantienen en las tres.
- `Resumen` comienza en la tarjeta de progreso.
- Las instrucciones se dividen en pasos (líneas, numeración inline o fin de oración) y se muestran como lista numerada con números en acento, `space-y-5` y `text-zinc-200 leading-relaxed`.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-043 (detalle del ejercicio)
- **Bloquea a**: TKT-OMEGYM-045

## Archivos Afectados
- `src/lib/instructions.ts` (nuevo)
- `src/pages/member/ExerciseDetail.tsx`

## Implementación
- [x] Parser de instrucciones con los tres modos y fusión de fragmentos cortos
- [x] Lista numerada con números en acento y espaciado amplio
- [x] Imagen y título comunes a las pestañas
- [x] `Resumen` sin bloque visual duplicado
- [x] Estado vacío de indicaciones
- [x] `npm run build` sin errores

## Criterios de aceptación
- [ ] Imagen y título visibles en Resumen, Historial e Indicaciones.
- [ ] El párrafo del catálogo se muestra como pasos numerados.
- [ ] Números en acento, texto claro y separación amplia.
- [ ] Numeración inline y saltos de línea se respetan.
- [ ] Sin instrucciones: estado vacío.
- [x] `npm run build` y `openspec validate` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- Parser probado con párrafos reales, numeración inline, líneas y decimales:
  - párrafo de 4 oraciones → 4 pasos;
  - `1. ... 2. ... 3. ...` → 3 pasos;
  - 3 líneas → 3 pasos;
  - `1.5 kg` no rompe la oración.
- Detalle recompuesto con bloque visual común.
- `npm run build` OK (158 módulos) y `openspec validate` OK.
- **Pendiente**: QA visual de las tres pestañas.

**Commit**: —
