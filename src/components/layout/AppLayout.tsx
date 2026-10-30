import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavigationDrawer } from './NavigationDrawer'
import { getRoleNav, NAV_ICONS } from './nav-config'
import { useAuthStore } from '@/store/auth.store'
import { useSidebarStore } from '@/store/sidebar.store'
import { SettingsModal } from '@/pages/settings/SettingsModal'
import { BottomNav, type BottomNavItem } from '@/components/ui/layout/BottomNav'
import { MoreSheet } from '@/components/ui/layout/MoreSheet'
import { paymentsService } from '@/services/payments.service'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  trainer: 'Entrenador',
  member: 'Miembro',
}

/**
 * Shell único de la aplicación: barra inferior por rol, hoja "Más" y drawer
 * bajo demanda. Sin barras laterales fijas.
 */
export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const nav = getRoleNav(user?.role)
  const roleLabel = ROLE_LABEL[user?.role || 'member'] || 'Miembro'

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [pending, setPending] = useState(0)

  const { close } = useSidebarStore()
  const pathname = useLocation().pathname

  useEffect(() => { close() }, [pathname, close])

  useEffect(() => {
    if (user?.role !== 'admin') return
    paymentsService.getPendingCount().then(setPending).catch(() => {})
  }, [user?.role])

  const tabs: BottomNavItem[] = nav.tabs.map(item => ({
    ...item,
    badge: item.badgeKey === 'pendingPayments' ? pending : undefined,
  }))

  const moreActive = nav.more.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/'),
  )

  return (
    <div className="min-h-dvh bg-bg">
      <NavigationDrawer
        sections={nav.sections}
        icons={NAV_ICONS}
        roleLabel={roleLabel}
        onSettings={() => setSettingsOpen(true)}
        pendingPayments={pending}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="flex flex-col min-h-dvh pb-24 lg:pb-28">
        <Outlet />
      </main>

      <BottomNav
        items={tabs}
        icons={NAV_ICONS}
        onMore={() => setMoreOpen(true)}
        moreActive={moreActive}
      />

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={nav.more}
        icons={NAV_ICONS}
        onSettings={() => setSettingsOpen(true)}
        roleLabel={roleLabel}
      />
    </div>
  )
}
