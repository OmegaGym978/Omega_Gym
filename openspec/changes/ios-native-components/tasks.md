# Tasks

## 1. Tokens

- [x] 1.1 Subir superficies a zinc-900/800/700 y añadir `divider` (oscuro y claro)
- [x] 1.2 Mantener `text-3` como zinc-500 para placeholders y secundarios

## 2. Átomos

- [x] 2.1 `Button`: `primary` píldora `h-12/h-14`, `secondary` zinc-800, `plain` para headers, `danger`; `active:opacity-70`, sin hover ni sombra
- [x] 2.2 `Input/Textarea/Select`: sin borde, zinc-900, `rounded-2xl`, `p-4`, 17px, placeholder zinc-500, foco con ring
- [x] 2.3 `Card` reutilizable (surface, `rounded-2xl/3xl`, sin borde ni sombra)
- [x] 2.4 `Switch` nativo con `role="switch"` y acento
- [x] 2.5 `Checkmark` circular presentacional
- [x] 2.6 `IconButton` sin borde y con feedback táctil

## 3. Hojas inferiores

- [x] 3.1 `BottomSheet` con `rounded-t-3xl`, drag handle, `max-h-[90vh]` y safe-area
- [x] 3.2 `Modal` como wrapper del sheet (los 26 usos cambian sin editar páginas)
- [x] 3.3 `ConfirmSheet` reutilizable
- [x] 3.4 Confirmación del builder migrada a `ConfirmSheet`

## 4. Listas y adopción

- [x] 4.1 `ListGroup` y `ListTile` (divisor, icono/avatar, subtítulo, chevron, `selected`)
- [x] 4.2 Ajustes: sheet con `Switch`, `ListGroup` y swatches de acento
- [x] 4.3 "Más": grilla → celdas agrupadas
- [x] 4.4 Selector de ejercicios: filas ad-hoc → `ListTile` con `Checkmark`
- [x] 4.5 Asignación de planes y selector de miembros → `Checkmark`
- [x] 4.6 Headers de Miembros, Membresías, Planes y Entrenamiento → `Button plain`
- [x] 4.7 Inputs de autenticación y `SearchInput` al estilo nativo
- [x] 4.8 `TabBar` a píldoras sin borde

## 5. Barrido

- [x] 5.1 Eliminar `hover` (87 usos); conservar `lg:hover` en filas de tablas
- [x] 5.2 Eliminar sombras de contenedores
- [x] 5.3 Quitar 71 bordes de tarjetas que dependían del contraste
- [x] 5.4 Verificar que ningún estado hover quede aplicado permanentemente

## 6. Verificación

- [x] 6.1 `npm run build` sin errores
- [x] 6.2 `openspec validate ios-native-components --strict`
- [ ] 6.3 QA visual 360/390/768/1280 en claro y oscuro
- [ ] 6.4 QA de contraste de textos secundarios sobre zinc-900
- [ ] 6.5 Validación del dueño y cierre de TKT-038/039
