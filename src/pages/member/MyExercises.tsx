import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { exercisesService, type Exercise } from '@/services/exercises.service'
import { equipmentLabel, muscleLabel } from '@/lib/exercise-labels'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'
import { Input } from '@/components/ui/atoms/Input'
import { ListGroup } from '@/components/ui/molecules/ListGroup'
import { ListTile } from '@/components/ui/molecules/ListTile'
import { ExerciseFilterSheet } from '@/components/exercises/ExerciseFilterSheet'
import { CreateExerciseSheet } from '@/components/exercises/CreateExerciseSheet'

const PAGE_SIZE = 40

export default function MyExercisesPage() {
  const user = useAuthStore(s => s.user)

  const [query, setQuery] = useState('')
  const [equipment, setEquipment] = useState('')
  const [muscle, setMuscle] = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterMode, setFilterMode] = useState<'equipment' | 'muscle' | null>(null)
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([])
  const [muscleOptions, setMuscleOptions] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)

  const debounceRef = useRef<number | null>(null)
  const lastParamsRef = useRef({ q: '', equipment: '', muscle: '' })

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
      const page = data.slice(0, PAGE_SIZE)
      setResults(prev => (offset === 0 ? page : [...prev, ...page]))
      setHasMore(data.length > PAGE_SIZE)
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

  useEffect(() => {
    Promise.all([exercisesService.getEquipment(), exercisesService.getMuscleGroups()])
      .then(([equipments, muscles]) => {
        setEquipmentOptions(equipments)
        setMuscleOptions(muscles)
      })
      .catch(() => { /* los filtros quedan sin opciones; la búsqueda sigue */ })
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => loadPage(query, equipment, muscle, 0), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, equipment, muscle, loadPage])

  function reload() {
    loadPage(query, equipment, muscle, 0)
  }

  return (
    <>
      <ScreenHeader
        title="Ejercicios"
        back="/my-profile"
        centerTitle
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-10 px-2 rounded-lg bg-transparent text-accent text-[14px] font-semibold border-none cursor-pointer active:opacity-70 transition-opacity"
          >
            Crear
          </button>
        }
      />

      <div className="px-4 sm:px-5 py-4 flex-1 mx-auto w-full max-w-[560px]">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar ejercicio..."
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterMode('equipment')}
            className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold border-none cursor-pointer active:opacity-70 transition-colors ${
              equipment ? 'bg-accent-dim text-accent' : 'bg-surface2 text-text-2'
            }`}
          >
            {equipment ? equipmentLabel(equipment) : 'Todo el Equipamiento'}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('muscle')}
            className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold border-none cursor-pointer active:opacity-70 transition-colors ${
              muscle ? 'bg-accent-dim text-accent' : 'bg-surface2 text-text-2'
            }`}
          >
            {muscle ? muscleLabel(muscle) : 'Todos los Músculos'}
          </button>
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-[72px] rounded-2xl skeleton" />)}
            </div>
          ) : error ? (
            <div className="bg-surface rounded-2xl p-8 text-center flex flex-col items-center gap-3">
              <div className="text-[13px] text-text-3">{error}</div>
              <button
                type="button"
                onClick={reload}
                className="h-11 px-5 rounded-full bg-accent text-accent-contrast text-[13px] font-bold border-none cursor-pointer active:opacity-70"
              >
                Reintentar
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-surface rounded-2xl p-10 text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-surface2 text-text-3 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="text-sm font-semibold">Sin resultados</div>
              <div className="text-[12px] text-text-3">Prueba con otro nombre o cambia los filtros.</div>
            </div>
          ) : (
            <>
              <ListGroup>
                {results.map(ex => (
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
                          className="w-12 h-12 rounded-full object-cover bg-white"
                        />
                      ) : (
                        <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.8">
                            <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
                          </svg>
                        </span>
                      )
                    }
                    chevron
                    href={`/my-profile/exercises/${ex.id}`}
                  />
                ))}
              </ListGroup>

              {hasMore && (
                <button
                  type="button"
                  onClick={() => loadPage(lastParamsRef.current.q, lastParamsRef.current.equipment, lastParamsRef.current.muscle, results.length)}
                  disabled={loadingMore}
                  className="w-full h-11 mt-3 rounded-full bg-surface text-accent text-[13px] font-bold border-none cursor-pointer active:opacity-70 disabled:opacity-50 transition-opacity"
                >
                  {loadingMore ? 'Cargando…' : 'Ver más ejercicios'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <ExerciseFilterSheet
        open={filterMode !== null}
        mode={filterMode ?? 'equipment'}
        value={filterMode === 'muscle' ? muscle : equipment}
        options={filterMode === 'muscle' ? muscleOptions : equipmentOptions}
        onClose={() => setFilterMode(null)}
        onSelect={value => {
          if (filterMode === 'muscle') setMuscle(value)
          else setEquipment(value)
        }}
      />

      <CreateExerciseSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        userId={user?.id ?? ''}
        onCreated={() => {
          setQuery('')
          setEquipment('')
          setMuscle('')
          loadPage('', '', '', 0)
        }}
      />
    </>
  )
}
