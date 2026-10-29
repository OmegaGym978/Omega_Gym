'use client';

import { Button } from '@/components/ui/atoms/Button'
import { usePwaStore, updateSW } from '@/store/pwa.store'

export function PwaUpdateBanner() {
  const needRefresh = usePwaStore(s => s.needRefresh)

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[calc(100vw-2rem)] max-w-[420px] animate-slide-up">
      <div
        className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 px-4 py-3"
        style={{ background: 'var(--surface)', boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div min-w-0>
            <div className="text-[13px] font-semibold leading-tight">Nueva versión disponible</div>
            <div className="text-[11px] text-text-3 mt-0.5 leading-tight">Actualiza para ver los últimos cambios</div>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={() => updateSW(true)}
        >
          Actualizar
        </Button>
      </div>
    </div>
  )
}