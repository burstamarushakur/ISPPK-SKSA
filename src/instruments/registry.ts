import type { InstrumentVersion } from '../lib/types'
import { ISPPK_2026 } from './isppk2026'

export const DEFAULT_INSTRUMENTS: InstrumentVersion[] = [ISPPK_2026]

export function getDefaultInstrumentFromList(items: InstrumentVersion[]) {
  const active = items.filter(x => x.active).sort((a,b) => b.year - a.year)
  return active.find(x => x.isDefault) || active[0] || items[0]
}

export function cloneInstrumentForYear(source: InstrumentVersion, year: number): InstrumentVersion {
  const now = new Date().toISOString()
  const replaceYear = (value: string) => value.replace(String(source.year), String(year))
  return {
    ...structuredClone(source),
    id: `isppk-pdp-${year}-v1`,
    year,
    code: `ISPPK-PDP-${year}-V1`,
    title: replaceYear(source.title),
    shortTitle: replaceYear(source.shortTitle),
    description: `Draf versi ${year} yang diduplikasi daripada ${source.year}. Semak rubrik, PDF rasmi dan mapping Google Form sebelum diaktifkan.`,
    active: false,
    isDefault: false,
    templatePdfPath: '',
    googleFormMapping: null,
    sourceNote: `Draf dibuat daripada versi ${source.year}. Jangan aktifkan sebelum dokumen rasmi tahun ${year} disemak.`,
    createdAt: now,
    updatedAt: now
  }
}
