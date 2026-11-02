import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/atoms/Button'
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner'
import { Modal } from '@/components/ui/molecules/Modal'
import { ListGroup } from '@/components/ui/molecules/ListGroup'
import { ListTile } from '@/components/ui/molecules/ListTile'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { membershipsService, type MembershipType } from '@/services/memberships.service'
import { useCacheStore } from '@/store/cache.store'
import { fmtMoney, getErrorMessage } from '@/lib/helpers'
import { IconPlus, IconTrash, IconAlert, IconMemberships } from '@/lib/icons'

interface FormState {
  name: string
  price: string
  days: string
  description: string
}

const EMPTY_FORM: FormState = { name: '', price: '', days: '', description: '' }

/** Evita duplicados por id aunque el backend repita filas. */
function uniqueById(rows: MembershipType[]): MembershipType[] {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values())
}

function Chevron() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      className="text-text-3 shrink-0"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-text-3">{label}</label>
      {children}
    </div>
  )
}

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-surface2 px-4 py-3 font-sans text-[15px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent disabled:opacity-40'

/**
 * Gestión de tipos de membresía (precios base): crear, editar y eliminar.
 * Escribe en `membership_types`; el borrado cae a desactivación si el tipo ya
 * tiene membresías asociadas.
 */
export default function MembershipTypesPage() {
  const [types, setTypes] = useState<MembershipType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MembershipType | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<MembershipType | null>(null)
  const [deleting, setDeleting] = useState(false)

  const invalidate = useCacheStore((s) => s.invalidate)

  /** Refresco silencioso tras crear/editar/eliminar. */
  const reload = useCallback(async () => {
    try {
      setTypes(uniqueById(await membershipsService.getTypes()))
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudieron cargar las membresías.'))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await membershipsService.getTypes()
        if (cancelled) return
        setTypes(uniqueById(data))
        setError(null)
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, 'No se pudieron cargar las membresías.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(type: MembershipType) {
    setEditing(type)
    setForm({
      name: type.name,
      price: String(type.price),
      days: String(type.duration_days),
      description: type.description ?? '',
    })
    setFormOpen(true)
  }

  /** Validación de los campos numéricos y del nombre duplicado. */
  function validate(): string | null {
    const name = form.name.trim()
    if (!name) return 'El nombre de la membresía es obligatorio.'

    const price = Number(form.price)
    if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
      return 'Ingresa un precio válido (mayor o igual a 0).'
    }

    const days = Number(form.days)
    if (!form.days.trim() || !Number.isInteger(days) || days < 1) {
      return 'La duración debe ser un número entero de días (mínimo 1).'
    }

    const duplicated = types.some(
      (t) => t.name.trim().toLowerCase() === name.toLowerCase() && t.id !== editing?.id,
    )
    if (duplicated) return 'Ya existe una membresía activa con ese nombre.'

    return null
  }

  async function handleSave() {
    // Candado contra doble envío: dos clics rápidos insertaban dos filas.
    if (saving) return

    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }

    const payload = {
      name: form.name.trim(),
      price: Number(Number(form.price).toFixed(2)),
      duration_days: Number(form.days),
      description: form.description.trim() || null,
    }

    setSaving(true)
    try {
      if (editing) await membershipsService.updateType(editing.id, payload)
      else await membershipsService.createType(payload)

      invalidate('membership_types')
      setFormOpen(false)
      await reload()
      toast.success(editing ? 'Membresía actualizada' : 'Membresía creada')
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo guardar la membresía.'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await membershipsService.deleteType(deleteTarget.id)
      invalidate('membership_types')
      setDeleteTarget(null)
      await reload()
      toast.success(
        result === 'deleted'
          ? 'Membresía eliminada'
          : 'La membresía tiene registros asociados: se desactivó para conservar el historial',
      )
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo eliminar la membresía.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <ScreenHeader title="Precios de membresías" subtitle="Costos base del gimnasio" back="/my-profile" />

      <PageContainer className="flex-1 pb-10">
        <Button
          variant="primary"
          className="w-full"
          icon={<IconPlus />}
          onClick={openNew}
          data-brand-accent="coral"
        >
          Nueva membresía
        </Button>

        <div className="mt-5">
          {loading ? (
            <LoadingSpinner text="Cargando membresías…" />
          ) : error ? (
            <div className="rounded-tile bg-red-bg px-4 py-3 text-[13px] leading-relaxed text-red-text">{error}</div>
          ) : types.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-surface px-4 py-10 text-center">
              <div className="text-[14px] font-medium text-text">Sin membresías activas</div>
              <div className="mt-1 text-[12px] text-text-3">Crea la primera con el botón de arriba.</div>
            </div>
          ) : (
            <ListGroup>
              {types.map((type) => (
                <ListTile
                  key={type.id}
                  title={type.name}
                  subtitle={`${type.duration_days} día${type.duration_days === 1 ? '' : 's'}${
                    type.description ? ` · ${type.description}` : ''
                  }`}
                  trailing={
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[14px] font-semibold text-text">
                        {fmtMoney(Number(type.price))}
                      </span>
                      <Chevron />
                    </span>
                  }
                  onClick={() => openEdit(type)}
                />
              ))}
            </ListGroup>
          )}
        </div>

        <p className="mt-3 px-1 text-[11px] leading-relaxed text-text-3">
          Los cambios aplican a las membresías nuevas. Las ya vendidas conservan su precio y su vigencia.
        </p>
      </PageContainer>

      {/* Alta / edición */}
      <Modal
        open={formOpen}
        onClose={() => { if (!saving) setFormOpen(false) }}
        title={editing ? 'Editar membresía' : 'Nueva membresía'}
        compact
        icon={<IconMemberships width="16" height="16" />}
      >
        <Field label="Nombre del plan">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={saving}
            placeholder="Mensual, Visita, Semestral…"
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[15px] text-text-3">$</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                disabled={saving}
                placeholder="0.00"
                className={`${INPUT_CLASS} pl-8 font-mono`}
              />
            </div>
          </Field>

          <Field label="Duración">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.days}
                onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))}
                disabled={saving}
                placeholder="30"
                className={`${INPUT_CLASS} pr-12 font-mono`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-text-3">días</span>
            </div>
          </Field>
        </div>

        <Field label="Descripción breve">
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            disabled={saving}
            rows={2}
            placeholder="Acceso ilimitado a instalaciones…"
            className={`${INPUT_CLASS} resize-none`}
          />
        </Field>

        <div className="flex flex-col gap-1 pt-1">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleSave}
            disabled={saving}
            data-brand-accent="coral"
          >
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear membresía'}
          </Button>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            disabled={saving}
            className="h-11 w-full rounded-full border-none bg-transparent font-sans text-[14px] font-semibold text-text-2 transition-opacity active:opacity-70 disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>

        {editing && (
          <button
            type="button"
            onClick={() => setDeleteTarget(editing)}
            disabled={saving}
            className="mx-auto mt-1 inline-flex items-center gap-1.5 rounded-full border-none bg-transparent px-3 py-2 font-sans text-[12px] font-medium text-red-text/80 transition-colors hover:text-red-text disabled:opacity-40"
          >
            <IconTrash width="14" height="14" />
            Eliminar membresía
          </button>
        )}
      </Modal>

      {/* Confirmación de borrado */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => { if (!deleting) setDeleteTarget(null) }}
        title="Eliminar membresía"
        compact
        icon={<IconAlert width="16" height="16" />}
      >
        <div className="text-[13px] leading-relaxed">
          ¿Eliminar <strong>{deleteTarget?.name}</strong> de los precios base?
        </div>
        <div className="rounded-tile bg-amber-bg p-3.5 text-[12px] leading-relaxed text-amber-text">
          Dejará de estar disponible para nuevas membresías. Si ya tiene membresías o pagos registrados,
          se desactiva en lugar de borrarse para conservar el historial.
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
