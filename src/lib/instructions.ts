/**
 * Convierte las instrucciones del catálogo (párrafo único, líneas o numeración
 * inline) en pasos legibles. El catálogo actual trae un solo párrafo con
 * oraciones separadas por punto.
 */
export function splitInstructions(raw: string | null | undefined): string[] {
  if (!raw) return []

  const normalized = raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  if (!normalized) return []

  const hasLines = normalized.includes('\n')
  const inlineNumbered = (normalized.match(/\d+[.)]\s/g) || []).length >= 2
  const sentenceSplit = /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/

  let parts: string[]
  if (hasLines) {
    parts = normalized.split(/\n+/)
  } else if (inlineNumbered) {
    parts = normalized.split(/\s*(?=\d+[.)]\s)/)
  } else {
    parts = normalized.split(sentenceSplit)
  }

  // Solo en modo párrafo se unen fragmentos cortos (abreviaturas o restos).
  const mergeShort = !hasLines && !inlineNumbered

  const steps: string[] = []
  for (const part of parts) {
    const cleaned = part.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim()
    if (!cleaned) continue

    if (mergeShort && steps.length > 0 && cleaned.length < 12 && !/[.!?]$/.test(cleaned)) {
      steps[steps.length - 1] = `${steps[steps.length - 1]} ${cleaned}`
    } else {
      steps.push(cleaned)
    }
  }

  return steps.slice(0, 20)
}
