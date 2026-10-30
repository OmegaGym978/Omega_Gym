import { useCallback, useEffect, useRef, useState } from 'react'
import { exercisesService, type Exercise } from '@/services/exercises.service'
import { ListGroup } from '@/components/ui/molecules/ListGroup'
import { ListTile } from '@/components/ui/molecules/ListTile'
import { Checkmark } from '@/components/ui/atoms/Checkmark'
import { ExerciseFilterSheet } from '@/components/exercises/ExerciseFilterSheet'
import { equipmentLabel, muscleLabel } from '@/lib/exercise-labels'

const PAGE_SIZE = 40

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (exercises: Exercise[]) => void
  /** IDs de catálogo que ya forman parte de la rutina. */
  excludeIds?: string[]
}

type FilterSheet = 'equipment' | 'muscle' | null

export function ExerciseMultiPicker({ open, onClose, onConfirm, excludeIds }: Props) {
  const [query, setQuery] = useState('')
  const [equipment, setEquipment] = useState('')
  const [muscle, setMuscle] = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [selected, setSelected] = useState<Map<string, Exercise>>(new Map())
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterSheet, setFilterSheet] = useState<FilterSheet>(null)
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([])
  const [muscleOptions, setMuscleOptions] = useState<string[]>([])

  const debounceRef = useRef<number | null>(null)
  const lastParamsRef = useRef({ q: '', equipment: '', muscle: '' })
  const excluded = new Set(excludeIds ?? [])

  const loadPage = useCallback(async (q: string, eq: string, mu: string, offset: number) => {
    if (offset === 0) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }
    try {
      const data = await exercisesService.getAll({
        search: q.trim() || undefined,
        equipment: eq || undefined,
        muscle_group: mu || undefined,
        limit: PAGE_SIZE + 1,
        offset: offset > 0 ? offset : undefined,
      })
      const more = data.length > PAGE_SIZE
      const page = data.slice(0, PAGE_SIZE)
      setResults(prev => (offset === 0 ? page : [...prev, ...page]))
      setHasMore(more)
      lastParamsRef.current = { q, equipment: eq, muscle: mu }
    } catch (e: any) {
      if (offset === 0) setResults([])
      setHasMore(false)
      setError(e?.message || 'No se pudo cargar el catálogo')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Reinicio al abrir
  useEffect(() => {
    if (!open) return
    setQuery('')
    setEquipment('')
    setMuscle('')
    setSelected(new Map())
    setFilterSheet(null)
    setResults([])
    setHasMore(false)
    setError(null)
    loadPage('', '', '', 0)
  }, [open, loadPage])

  // Opciones de filtro (una sola vez)
  useEffect(() => {
    if (!open || equipmentOptions.length > 0) return
    Promise.all([exercisesService.getEquipment(), exercisesService.getMuscleGroups()])
      .then(([eqs, mus]) => {
        setEquipmentOptions(eqs)
        setMuscleOptions(mus)
      })
      .catch(() => { /* los filtros quedan vacíos; la búsqueda sigue operativa */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Búsqueda con debounce
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => loadPage(query, equipment, muscle, 0), 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, equipment, muscle, open, loadPage])

  function toggleExercise(ex: Exercise) {
    if (excluded.has(ex.id)) return
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(ex.id)) next.delete(ex.id)
      else next.set(ex.id, ex)
      return next
    })
  }

  function handleConfirm() {
    if (selected.size === 0) return
    onConfirm([...selected.values()])
  }

  const count = selected.size

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-bg flex flex-col animate-picker-in">
      {/* Buscador y filtros */}
      <div className="px-4 pt-4 pb-2 border-b border-border bg-bg">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="w-full bg-surface2 border border-transparent text-text text-sm pl-10 pr-9 py-3 rounded-full outline-none placeholder:text-text-3 focus:border-accent/40 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface2 text-text-3 flex items-center justify-center border-none cursor-pointer"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar selector"
            className="w-11 h-11 shrink-0 rounded-full bg-surface2 text-text-2 flex items-center justify-center border-none cursor-pointer transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterSheet('equipment')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
              equipment
                ? 'bg-accent-dim text-accent border-accent/40'
                : 'bg-surface2 text-text-2'
            }`}
          >
            {equipment ? equipmentLabel(equipment) : 'Todo el Equipamiento'}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            onClick={() => setFilterSheet('muscle')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
              muscle
                ? 'bg-accent-dim text-accent border-accent/40'
                : 'bg-surface2 text-text-2'
            }`}
          >
            {muscle ? muscleLabel(muscle) : 'Todos los Músculos'}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <div className="flex flex-col gap-2 p-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <div className="text-sm text-text-2">{error}</div>
            <button
              onClick={() => loadPage(query, equipment, muscle, 0)}
              className="px-4 py-2 rounded-full bg-accent text-accent-contrast text-xs font-bold border-none cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center text-text-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Sin resultados</div>
            <div className="text-xs text-text-3">Prueba con otro nombre o cambia los filtros.</div>
          </div>
        ) : (
          <>
            <ListGroup>
              {results.map(ex => {
                const isExcluded = excluded.has(ex.id)
                const isSelected = selected.has(ex.id)
                return (
                  <ListTile
                    key={ex.id}
                    title={ex.name_es || ex.name}
                    subtitle={muscleLabel(ex.muscle_group)}
                    avatar={
                      ex.gif_url ? (
                        <img
                          src={ex.gif_url}
                          alt=""
                          loading="lazy"
                          className="w-11 h-11 rounded-full object-cover bg-surface2"
                        />
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-surface2 flex items-center justify-center text-text-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
                          </svg>
                        </span>
                      )
                    }
                    trailing={
                      isExcluded ? (
                        <span className="shrink-0 text-[10px] font-semibold text-text-3">Ya incluido</span>
                      ) : (
                        <Checkmark checked={isSelected} />
                      )
                    }
                    selected={isSelected}
                    disabled={isExcluded}
                    onClick={() => toggleExercise(ex)}
                  />
                )
              })}
            </ListGroup>

            {hasMore && (
              <button
                onClick={() => loadPage(lastParamsRef.current.q, lastParamsRef.current.equipment, lastParamsRef.current.muscle, results.length)}
                disabled={loadingMore}
                className="w-full py-3 my-3 rounded-full text-[13px] font-bold text-accent bg-surface border-none cursor-pointer active:opacity-70 disabled:opacity-50 transition-opacity"
              >
                {loadingMore ? 'Cargando...' : 'Ver más ejercicios'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Acción inferior */}
      <div className="px-4 pt-3 pb-3 border-t border-border bg-bg safe-bottom">
        <button
          onClick={handleConfirm}
          disabled={count === 0}
          aria-live="polite"
          className="w-full py-3.5 rounded-full bg-accent text-accent-contrast text-sm font-bold border border-accent/25 cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {count === 0 ? 'Agrega ejercicios' : `Agrega ${count} ejercicio${count !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Filtros */}
      <ExerciseFilterSheet
        open={filterSheet !== null}
        mode={filterSheet ?? 'equipment'}
        value={filterSheet === 'muscle' ? muscle : equipment}
        options={filterSheet === 'muscle' ? muscleOptions : equipmentOptions}
        onClose={() => setFilterSheet(null)}
        onSelect={value => {
          if (filterSheet === 'muscle') setMuscle(value)
          else setEquipment(value)
        }}
      />
    </div>
  )
}
