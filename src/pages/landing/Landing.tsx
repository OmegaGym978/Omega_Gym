import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FAQ, FACTS, GYM, MEMBERSHIPS, type WeeklyHours } from './landing-content'

const NAV_LINKS = [
  { href: '#instalaciones', label: 'Instalaciones' },
  { href: '#membresias', label: 'Membresías' },
  { href: '#preguntas', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
]

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Día y minutos desde medianoche en la zona horaria del gimnasio. */
function gymClock(now: Date, timeZone: string): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const day = WEEKDAY_INDEX[get('weekday')] ?? now.getDay()
  const hour = Number(get('hour')) % 24
  const minute = Number(get('minute'))
  return { day, minutes: hour * 60 + minute }
}

function openStatus(now: Date): { open: boolean; detail: string } {
  const { day, minutes } = gymClock(now, GYM.timeZone)
  const slots: WeeklyHours[] = GYM.hours
  const today = slots.find((slot) => slot.day === day)

  if (today && minutes >= toMinutes(today.opens) && minutes < toMinutes(today.closes)) {
    return { open: true, detail: `cierra a las ${today.closes}` }
  }

  for (let i = 0; i < 7; i++) {
    const slotDay = (day + i) % 7
    const slot = slots.find((s) => s.day === slotDay)
    if (!slot) continue
    if (i === 0 && minutes >= toMinutes(slot.closes)) continue
    const when = i === 0 ? 'hoy' : i === 1 ? 'mañana' : `el ${DAY_NAMES[slotDay].toLowerCase()}`
    return { open: false, detail: `abre ${when} a las ${slot.opens}` }
  }

  return { open: false, detail: 'consulta el horario' }
}

const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(GYM.mapQuery)}&z=16&output=embed`

const BTN = 'inline-flex items-center justify-center gap-2 font-semibold font-sans select-none transition-opacity active:opacity-70'
const BTN_PRIMARY = `${BTN} rounded-full bg-accent text-accent-contrast hover:opacity-90`
const BTN_GHOST = `${BTN} rounded-full bg-surface2 text-text hover:bg-surface3`
const BTN_LG = 'h-12 px-6 text-[15px]'

const CONTACT = [
  {
    label: 'WhatsApp',
    value: GYM.phoneDisplay,
    href: `https://wa.me/${GYM.phoneE164}`,
    external: true,
    icon: (
      <path d="M20.5 3.5a10.4 10.4 0 0 0-16.8 11.7L2 21.5l6.5-1.7a10.4 10.4 0 0 0 12-16.3z" />
    ),
  },
  {
    label: 'Teléfono',
    value: GYM.phoneDisplay,
    href: `tel:+${GYM.phoneE164}`,
    external: false,
    icon: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    ),
  },
  {
    label: 'Correo',
    value: GYM.email,
    href: `mailto:${GYM.email}`,
    external: false,
    icon: (
      <>
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>
    ),
  },
]

function LogoTile({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-14 w-14 rounded-[18px]' : 'h-10 w-10 rounded-2xl'
  const glyph = size === 'lg' ? 26 : 18
  return (
    <span
      className={`${box} flex shrink-0 items-center justify-center`}
      style={{ background: 'var(--logo-bg)', border: '1px solid var(--logo-border)' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" width={glyph} height={glyph}>
        <text x="12" y="18" fontFamily="serif" fontSize="18" fontWeight="bold" style={{ fill: 'var(--logo-omega)' }} textAnchor="middle">
          Ω
        </text>
      </svg>
    </span>
  )
}

function OpenStatus() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const status = openStatus(now)

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" aria-live="polite">
      <span className={`inline-flex items-center gap-1.5 font-semibold ${status.open ? 'text-green-text' : 'text-red-text'}`}>
        <span className={`h-2 w-2 rounded-full ${status.open ? 'bg-green' : 'bg-red'}`} aria-hidden="true" />
        {status.open ? 'Abierto ahora' : 'Cerrado'}
      </span>
      <span className="text-text-3">· {status.detail}</span>
    </p>
  )
}

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text selection:bg-accent/20" data-brand-accent="coral">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
            <LogoTile />
            <span className="hidden text-[15px] font-bold leading-tight sm:inline">Omega Gym</span>
          </Link>

          <nav aria-label="Secciones" className="hidden items-center gap-1 text-[13px] text-text-2 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 transition-colors hover:bg-surface hover:text-text"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/login"
              className="inline-flex items-center whitespace-nowrap px-1 text-[12px] font-medium text-text no-underline transition-opacity hover:opacity-70 active:opacity-60 sm:text-[13px]"
            >
              Iniciar sesión
            </Link>
            <Link to="/register" className={`${BTN_PRIMARY} h-9 px-3 text-[12px] sm:h-10 sm:px-4 sm:text-[13px]`}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero + ficha del gimnasio + contacto */}
        <section id="instalaciones" className="relative mx-auto max-w-6xl scroll-mt-20 px-5 pb-20 pt-14 sm:px-6 md:pb-24 md:pt-20">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-dim px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
              Omega Gym
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-text sm:text-5xl md:text-[3.5rem]">
              Tu mejor versión empieza aquí.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-text-2 sm:text-lg">
              Entrena con el mejor equipo. Adquiere tu membresía, revisa tus planes de entrenamiento y gestiona tus
              pagos directamente desde tu cuenta.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register" className={`${BTN_PRIMARY} ${BTN_LG}`}>
                Crear cuenta
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link to="/login" className={`${BTN_GHOST} ${BTN_LG}`}>
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="relative mt-12 grid gap-5 md:mt-16 lg:grid-cols-12">
            {/* Bloque destacado del gimnasio */}
            <article
              aria-labelledby="ficha-nombre"
              className="min-w-0 rounded-[24px] border border-border bg-surface p-6 sm:p-8 lg:col-span-7"
            >
              <div className="flex items-center gap-4">
                <LogoTile size="lg" />
                <div className="min-w-0">
                  <h2 id="ficha-nombre" className="truncate text-xl font-semibold tracking-tight">
                    {GYM.name}
                  </h2>
                  <p className="text-[13px] text-text-2">Fuerza · Cardio · Acondicionamiento</p>
                </div>
              </div>

              <blockquote className="mt-5 border-l-2 border-accent/40 pl-4 text-[15px] italic leading-relaxed text-text/80">
                {GYM.slogan}
              </blockquote>

              <dl className="mt-6 grid gap-2 sm:grid-cols-2">
                {FACTS.map((fact, index) => (
                  <div
                    key={fact.label}
                    className={`rounded-2xl border border-border bg-bg/40 px-4 py-3 ${
                      index === FACTS.length - 1 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-3">{fact.label}</dt>
                    <dd className="mt-1 text-[13px] font-medium leading-snug text-text">
                      {Array.isArray(fact.value)
                        ? fact.value.map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))
                        : fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>

            {/* Ubicación y contacto */}
            <aside
              id="contacto"
              aria-labelledby="contacto-titulo"
              className="flex min-w-0 scroll-mt-20 flex-col rounded-[24px] border border-border bg-surface p-6 sm:p-8 lg:col-span-5"
            >
              <OpenStatus />

              <h2 id="contacto-titulo" className="mt-6 text-lg font-semibold tracking-tight">
                Instalaciones
              </h2>
              <address className="mt-1 not-italic leading-relaxed text-text-2">{GYM.address}</address>

              <div className="mt-5 flex min-h-48 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-bg">
                <iframe
                  title={`Mapa: ${GYM.address}`}
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block min-h-48 w-full flex-1 border-0 bg-bg"
                  style={{ filter: 'invert(90%) hue-rotate(180deg) contrast(0.9)' }}
                />
              </div>

              <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {CONTACT.map(({ label, value, href, external, icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="group flex min-h-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2/60 active:bg-surface2"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-accent"
                        aria-hidden="true"
                      >
                        {icon}
                      </svg>
                      <span className="w-20 shrink-0 text-[13px] text-text-2">{label}</span>
                      <span className="min-w-0 flex-1 text-[14px] font-medium tabular-nums [overflow-wrap:anywhere]">
                        {value}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-text-3/60 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        {/* Membresías y planes */}
        <section id="membresias" className="scroll-mt-20 border-t border-border/60">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 md:py-24 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em]">Membresías y planes</h2>
              <p className="mt-3 max-w-sm leading-relaxed text-text-2">
                Elige cómo entrenar. Todo se administra desde tu cuenta: pagos, renovaciones y rutinas.
              </p>
            </div>

            <ul className="divide-y divide-border border-y border-border lg:col-span-8">
              {MEMBERSHIPS.map((membership) => (
                <li key={membership.name} className="grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{membership.name}</h3>
                    <p className="mt-1 max-w-prose leading-relaxed text-text-2">{membership.description}</p>
                  </div>
                  <span className="justify-self-start whitespace-nowrap rounded-full bg-surface2 px-3 py-1 text-[11px] font-medium text-text-2">
                    {membership.tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section id="preguntas" className="scroll-mt-20 border-t border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 md:py-24 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em]">Preguntas frecuentes</h2>
              <p className="mt-3 max-w-sm leading-relaxed text-text-2">
                ¿Tienes otra duda?{' '}
                <a href="#contacto" className="font-medium text-accent underline-offset-4 hover:underline">
                  Escríbenos
                </a>
              </p>
            </div>

            <div className="divide-y divide-border overflow-hidden rounded-[24px] border border-border bg-surface lg:col-span-8">
              {FAQ.map((item) => (
                <details key={item.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium transition-colors hover:bg-surface2/40 sm:px-6 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="shrink-0 text-text-3 transition-transform duration-300 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </summary>
                  <p className="max-w-prose px-5 pb-5 text-[14px] leading-relaxed text-text-2 sm:px-6">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[13px] text-text-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <LogoTile />
            <span className="font-semibold text-text-2">Omega Gym</span>
          </div>
          <span>© {new Date().getFullYear()} Omega Gym. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
