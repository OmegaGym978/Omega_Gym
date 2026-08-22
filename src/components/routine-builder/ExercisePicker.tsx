import { useState, useEffect, useRef, useCallback } from 'react'
import { exercisesService, type Exercise } from '@/services/exercises.service'

const CATEGORY_LABELS: Record<string, string> = {
  'Pecho': 'Pecho',
  'Espalda': 'Espalda',
  'Pierna': 'Pierna',
  'Hombro': 'Hombro',
  'Brazo': 'Brazo',
  'Core': 'Core',
  'Pantorrilla': 'Pantorrilla',
  'Antebrazo': 'Antebrazo',
  'Cardio': 'Cardio',
  'Cuello': 'Cuello',
}

const EQUIPMENT_ES: Record<string, string> = {
  'barbell': 'Barra',
  'dumbbell': 'Mancuerna',
  'body weight': 'Peso corporal',
  'cable': 'Cable',
  'band': 'Banda',
  'kettlebell': 'Kettlebell',
  'machine': 'Maquina',
  'rope': 'Cuerda',
  'medicine ball': 'Balon medicinal',
  'ez barbell': 'Barra EZ',
  'leverage machine': 'Maquina palanca',
  'smith machine': 'Smith',
  'stability ball': 'Balon estabilidad',
  'weighted': 'Con peso',
}

const PAGE_SIZE = 40;

interface Props {
  value: string
  exerciseId: string | null
  onSelect: (exercise: { id: string; name: string; name_es: string; muscle: string | null; gif_url: string | null; reference_link: string | null; instructions_es: string | null }) => void
  placeholder?: string
}

export function ExercisePicker({ value, exerciseId, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Exercise[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastParamsRef = useRef<{ q: string; cat: string }>({ q: '', cat: '' })

  useEffect(() => {
    exercisesService.getCategories().then(setCategories).catch(() => {})
  }, [])

  const loadPage = useCallback(async (q: string, cat: string, offset: number) => {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)
    try {
      const filters: any = { limit: PAGE_SIZE + 1 }
      if (q.trim()) filters.search = q.trim()
      if (cat) filters.category = cat
      if (offset > 0) filters.offset = offset
      const data = await exercisesService.getAll(filters)
      const more = data.length > PAGE_SIZE
      setResults(prev => offset === 0
        ? data.slice(0, PAGE_SIZE)
        : [...prev, ...data.slice(0, PAGE_SIZE)])
      setHasMore(more)
      lastParamsRef.current = { q, cat }
    } catch {
      if (offset === 0) setResults([])
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      loadPage(query, selectedCategory, 0)
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedCategory, loadPage])

  useEffect(() => {
    if (!open) return
    loadPage(query, selectedCategory, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleLoadMore() {
    if (loading || loadingMore) return
    loadPage(lastParamsRef.current.q, lastParamsRef.current.cat, results.length)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(ex: Exercise) {
    onSelect({
      id: ex.id,
      name: ex.name,
      name_es: ex.name_es || ex.name,
      muscle: ex.muscle_group,
      gif_url: ex.gif_url,
      reference_link: ex.gif_url ? ex.gif_url : null,
      instructions_es: ex.instructions_es || null,
    })
    setQuery(ex.name_es || ex.name)
    setOpen(false)
  }

  const displayName = (cat: string) => CATEGORY_LABELS[cat] || cat
  const displayEquip = (eq: string) => EQUIPMENT_ES[eq] || eq

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[11px] font-medium text-text-3 block mb-1.5">Ejercicio</label>

      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Buscar ejercicio...'}
          className="w-full bg-surface2 border border-border2 text-text font-sans text-xs pl-8 pr-2.5 py-2 rounded-sm outline-none placeholder:text-text-3 focus:border-accent transition-colors"
        />
      </div>

      {/* Category filters */}
      {open && (
        <div className="flex flex-wrap gap-1 mt-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-medium cursor-pointer transition-all duration-150 border ${
              !selectedCategory
                ? 'bg-accent/20 text-accent border-accent/30'
                : 'bg-transparent text-text-3 border-border hover:bg-surface2'
            }`}>
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              className={`px-2 py-0.5 rounded-full text-[9px] font-medium cursor-pointer transition-all duration-150 border ${
                selectedCategory === cat
                  ? 'bg-accent/20 text-accent border-accent/30'
                  : 'bg-transparent text-text-3 border-border hover:bg-surface2'
              }`}>
              {displayName(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Results dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border2 rounded shadow-lg max-h-[280px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 rounded-full border border-accent border-t-transparent animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center text-[11px] text-text-3">
              {query ? 'Sin resultados' : 'Escribe para buscar'}
            </div>
          ) : (
            results.map(ex => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelect(ex)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors duration-100 hover:bg-surface2 ${
                  exerciseId === ex.id ? 'bg-accent-dim' : ''
                }`}>
                {/* Thumbnail */}
                {ex.gif_url ? (
                  <img
                    src={ex.gif_url}
                    alt={ex.name_es || ex.name}
                    className="w-10 h-10 rounded object-cover bg-surface3 shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-surface3 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-3">
                      <circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-text truncate">{ex.name_es || ex.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-accent bg-accent-dim px-1.5 py-[1px] rounded-full">{displayName(ex.muscle_group)}</span>
                    <span className="text-[9px] text-text-3 bg-surface3 px-1.5 py-[1px] rounded-full">{displayEquip(ex.equipment)}</span>
                  </div>
                </div>

                {/* Selected indicator */}
                {exerciseId === ex.id && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))
          )}
          {!loading && hasMore && (
            <button type="button" onClick={handleLoadMore} disabled={loadingMore}
              className="w-full py-2 text-[11px] font-semibold text-accent hover:bg-surface2 cursor-pointer border-t border-border2 transition-colors disabled:opacity-50">
              {loadingMore ? 'Cargando...' : 'Ver más'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
