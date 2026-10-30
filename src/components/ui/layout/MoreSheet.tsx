import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { ListGroup } from '@/components/ui/molecules/ListGroup'
import { ListTile } from '@/components/ui/molecules/ListTile'
import type { NavLink } from '@/components/layout/nav-config'

interface Props {
  open: boolean
  onClose: () => void
  items: NavLink[]
  icons: Record<string, string>
  onSettings: () => void
  roleLabel: string
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  )
}

/** Hoja "Más": resto de secciones en celdas agrupadas. */
export function MoreSheet({ open, onClose, items, icons, onSettings, roleLabel }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Más" subtitle={roleLabel} maxWidth="560px">
      <ListGroup>
        {items.map(item => (
          <ListTile
            key={item.href}
            title={item.label}
            icon={<NavIcon path={icons[item.icon] || ''} />}
            chevron
            href={item.href}
            onClick={onClose}
          />
        ))}
        <ListTile
          title="Ajustes"
          subtitle="Tema, color de acento y cuenta"
          icon={<NavIcon path={icons.settings || ''} />}
          chevron
          onClick={() => { onClose(); onSettings() }}
        />
      </ListGroup>
    </BottomSheet>
  )
}
