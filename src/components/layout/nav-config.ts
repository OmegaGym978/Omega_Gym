export interface NavLink {
  label: string
  href: string
  icon: string
  badgeKey?: 'pendingPayments'
}

export interface NavSection {
  section: string
  items: NavLink[]
}

export interface RoleNav {
  tabs: NavLink[]
  more: NavLink[]
  sections: NavSection[]
}

export const NAV_ICONS: Record<string, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  dumbbell: '<path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10"/>',
  members: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M19 11l2 2 4-4"/>',
  memberships: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',
  payments: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  plans: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  fingerprint: '<path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>',
  checkin: '<rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><polyline points="9 13 12 16 17 11"/>',
  profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  more: '<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>',
}

const dev = import.meta.env.DEV

const memberNav: RoleNav = {
  tabs: [
    { label: 'Inicio', href: '/my-plan', icon: 'home' },
    { label: 'Entrenamiento', href: '/my-routines', icon: 'dumbbell' },
    { label: 'Membresía', href: '/my-membership', icon: 'memberships' },
    { label: 'Perfil', href: '/my-profile', icon: 'profile' },
  ],
  more: [
    ...(dev ? [{ label: 'Asistencia', href: '/my-checkins', icon: 'checkin' }] : []),
  ],
  sections: [
    { section: 'Entrenar', items: [
      { label: 'Inicio', href: '/my-plan', icon: 'home' },
      { label: 'Entrenamiento', href: '/my-routines', icon: 'dumbbell' },
    ]},
    { section: 'Mi cuenta', items: [
      { label: 'Mi membresía', href: '/my-membership', icon: 'memberships' },
      ...(dev ? [{ label: 'Asistencia', href: '/my-checkins', icon: 'checkin' }] : []),
      { label: 'Perfil', href: '/my-profile', icon: 'profile' },
    ]},
  ],
}

const adminNav: RoleNav = {
  tabs: [
    { label: 'Inicio', href: '/dashboard', icon: 'home' },
    { label: 'Miembros', href: '/members', icon: 'members' },
    { label: 'Pagos', href: '/payments', icon: 'payments' },
    { label: 'Perfil', href: '/my-profile', icon: 'profile' },
  ],
  more: [
    { label: 'Membresías', href: '/memberships', icon: 'memberships' },
    { label: 'Planes', href: '/training-plans', icon: 'plans', badgeKey: 'pendingPayments' },
    ...(dev ? [{ label: 'Huella', href: '/fingerprint', icon: 'fingerprint' }] : []),
  ],
  sections: [
    { section: 'Principal', items: [
      { label: 'Inicio', href: '/dashboard', icon: 'home' },
    ]},
    { section: 'Gestión', items: [
      { label: 'Miembros', href: '/members', icon: 'members' },
      { label: 'Membresías', href: '/memberships', icon: 'memberships' },
      { label: 'Pagos', href: '/payments', icon: 'payments', badgeKey: 'pendingPayments' },
      { label: 'Planes de entrenamiento', href: '/training-plans', icon: 'plans' },
      ...(dev ? [{ label: 'Registro de huella', href: '/fingerprint', icon: 'fingerprint' }] : []),
    ]},
    { section: 'Cuenta', items: [
      { label: 'Mi perfil', href: '/my-profile', icon: 'profile' },
    ]},
  ],
}

const trainerNav: RoleNav = {
  tabs: [
    { label: 'Inicio', href: '/dashboard', icon: 'home' },
    { label: 'Miembros', href: '/members', icon: 'members' },
    { label: 'Membresías', href: '/memberships', icon: 'memberships' },
    { label: 'Perfil', href: '/my-profile', icon: 'profile' },
  ],
  more: [
    { label: 'Planes', href: '/training-plans', icon: 'plans' },
  ],
  sections: [
    { section: 'Principal', items: [
      { label: 'Inicio', href: '/dashboard', icon: 'home' },
    ]},
    { section: 'Gestión', items: [
      { label: 'Miembros', href: '/members', icon: 'members' },
      { label: 'Membresías', href: '/memberships', icon: 'memberships' },
      { label: 'Planes de entrenamiento', href: '/training-plans', icon: 'plans' },
    ]},
    { section: 'Cuenta', items: [
      { label: 'Mi perfil', href: '/my-profile', icon: 'profile' },
    ]},
  ],
}

export function getRoleNav(role?: string): RoleNav {
  if (role === 'member') return memberNav
  if (role === 'trainer') return trainerNav
  return adminNav
}
