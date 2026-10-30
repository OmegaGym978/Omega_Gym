export function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
}

export function fmtDate(s: string | null) {
  if (!s) return '—'
  const [y, mo, d] = s.split('-')
  const m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(d)} ${m[parseInt(mo) - 1]} ${y}`
}

export function daysDiff(d: string | null) {
  if (!d) return null
  const [y, mo, day] = d.split('-')
  const joined = new Date(parseInt(y), parseInt(mo) - 1, parseInt(day))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today.getTime() - joined.getTime()) / 86400000)
}

const AVATAR_COLORS = [
  { bg: 'var(--accent-dim)', fg: 'var(--accent)' },
  { bg: 'rgba(16,185,129,0.15)', fg: '#34d399' },
  { bg: 'rgba(244,114,182,0.15)', fg: '#f472b6' },
  { bg: 'rgba(168,85,247,0.15)', fg: '#c084fc' },
  { bg: 'rgba(251,146,60,0.15)', fg: '#fb923c' },
  { bg: 'rgba(20,184,166,0.15)', fg: '#2dd4bf' },
]

export function avatarIndex(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash % AVATAR_COLORS.length
}

export function avatarColor(idOrName: string) {
  let hash = 0
  for (let i = 0; i < idOrName.length; i++) hash = idOrName.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function fmtMoney(amount: number) {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtPhone(p: string | null) {
  if (!p) return '—'
  const d = p.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}

export { AVATAR_COLORS }
