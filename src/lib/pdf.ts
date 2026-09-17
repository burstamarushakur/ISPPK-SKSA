import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { InstrumentVersion, Observation, SchoolClass, SchoolSettings, Subject, Teacher } from './types'
import { formatDateMY, formatTime, scoreSummary } from './utils'

function wrapText(text: string, maxChars: number) {
  const words = (text || '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars && line) { lines.push(line); line = word } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export async function generateOfficialPdf(
  obs: Observation,
  teacher: Teacher,
  schoolClass: SchoolClass,
  subject: Subject,
  school: SchoolSettings,
  instrument: InstrumentVersion
) {
  if (!instrument.templatePdfPath) throw new Error(`Template PDF untuk versi ${instrument.year} belum ditetapkan.`)
  if (instrument.pdfLayoutKey !== 'isppk-pdp-2026') {
    throw new Error(`Layout PDF '${instrument.pdfLayoutKey}' belum mempunyai renderer. Tambah mapping layout untuk versi ${instrument.year} dahulu.`)
  }

  const templateResponse = await fetch(instrument.templatePdfPath)
  if (!templateResponse.ok) throw new Error(`Template PDF versi ${instrument.year} tidak ditemui: ${instrument.templatePdfPath}`)
  const template = await templateResponse.arrayBuffer()
  const pdf = await PDFDocument.load(template)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pages = pdf.getPages()
  if (pages.length < 14) throw new Error(`Template PDF versi ${instrument.year} tidak sepadan dengan layout ISPPK yang dikonfigurasi.`)
  const black = rgb(0, 0, 0)
  const white = rgb(1, 1, 1)

  const drawAtTop = (pageIndex: number, text: string, x: number, yTop: number, size = 8.4, useBold = false, maxWidth?: number) => {
    const page = pages[pageIndex]
    const y = page.getHeight() - yTop - size
    let t = text || ''
    if (maxWidth) {
      const f = useBold ? bold : font
      while (t.length && f.widthOfTextAtSize(t, size) > maxWidth) t = t.slice(0, -1)
    }
    page.drawText(t, { x, y, size, font: useBold ? bold : font, color: black })
  }

  // Layout key is based on the official 2026 14-page PDF. Future versions can reuse
  // this renderer if the official layout remains identical, or add a new layout key.
  drawAtTop(2, obs.observerName.toUpperCase(), 210, 119, 8.2, true, 300)
  drawAtTop(2, obs.observerPosition.toUpperCase(), 210, 143, 8.2, false, 300)
  drawAtTop(2, formatDateMY(obs.observationDate), 210, 167, 8.2)
  drawAtTop(2, formatTime(obs.observationTime), 210, 191, 8.2)

  drawAtTop(2, school.schoolCode.toUpperCase(), 210, 280, 8.2, true)
  drawAtTop(2, school.schoolName.toUpperCase(), 210, 306, 8.0, true, 300)
  drawAtTop(2, school.ppd.toUpperCase(), 210, 332, 8.2)
  drawAtTop(2, school.state.toUpperCase(), 210, 358, 8.2)
  drawAtTop(2, school.officialEmail, 210, 384, 8.2, false, 300)

  drawAtTop(2, teacher.name.toUpperCase(), 210, 462, 8.0, true, 300)
  const genderX = obs.gender === 'Perempuan' ? 246 : 207
  drawAtTop(2, 'X', genderX, 486, 10, true)
  drawAtTop(2, (obs.optionName || teacher.optionName || '').toUpperCase(), 210, 514, 8.2, false, 300)

  drawAtTop(2, subject.name.toUpperCase(), 208, 596, 8.1, true, 305)
  pages[2].drawRectangle({ x: 201, y: pages[2].getHeight() - 648, width: 320, height: 23, color: white })
  drawAtTop(2, `${obs.studentsPresent ?? ''} / ${obs.studentsTotal ?? ''} ORANG`, 210, 631, 8.2, true, 295)
  drawAtTop(2, `TAHUN ${schoolClass.year} - ${schoolClass.name}`.toUpperCase(), 208, 656, 8.2, true, 305)
  drawAtTop(2, obs.topic.toUpperCase(), 208, 684, 8.0, false, 305)
  drawAtTop(2, formatTime(obs.pdpTime), 208, 711, 8.2, true)

  const teacherScores = Object.keys(obs.finalTeacherScores || {}).length ? obs.finalTeacherScores : obs.selfTeacherScores
  const scoreX = [0, 316.9, 416.6, 516.4, 616.1, 715.9]
  const teacherCoords: Record<string, [number, number]> = {
    '1.1': [3, 282], '1.2': [3, 454], '1.3': [4, 264], '1.4': [4, 474],
    '2.1': [5, 321], '2.2': [6, 166], '2.3': [7, 210], '2.4': [8, 166], '2.5': [9, 166], '3.1': [10, 189]
  }
  for (const [id, score] of Object.entries(teacherScores)) {
    const coord = teacherCoords[id]
    if (!coord || score < 1 || score > 5) continue
    const [pageIndex, yTop] = coord
    drawAtTop(pageIndex, 'X', scoreX[score] - 5, yTop, 18, true)
  }

  const studentScores = Object.keys(obs.finalStudentScores || {}).length ? obs.finalStudentScores : obs.selfStudentScores
  const studentX = [0, 417.7, 440.2, 462.7, 485.2, 507.7]
  const studentY = [0, 326, 364, 402, 439, 477, 515, 555, 592, 631, 684]
  instrument.studentRubric.slice(0, 10).forEach((item, index) => {
    const score = studentScores[item.id]
    if (score >= 1 && score <= 5) drawAtTop(11, 'X', studentX[score] - 4, studentY[index + 1], 14, true)
  })

  const total = scoreSummary(obs, instrument)
  const obtainedX = 392
  const totalRowsY = [166, 192, 218]
  instrument.domains.slice(0, 3).forEach((domain, index) => drawAtTop(12, String(total.domains[domain.id] || 0), obtainedX, totalRowsY[index], 10, true))
  drawAtTop(12, String(total.student), obtainedX, 244, 10, true)
  drawAtTop(12, String(total.total), obtainedX, 270, 10, true)
  drawAtTop(12, `${total.percent}%`, obtainedX, 296, 10, true)

  const bandIndex = Math.max(0, instrument.achievementBands.findIndex(b => total.percent >= b.min && total.percent <= b.max))
  const bandY = [421, 478, 541, 598, 648]
  if (bandY[bandIndex] != null) drawAtTop(12, 'X', 484, bandY[bandIndex], 18, true)

  const p14 = pages[13]
  const coverTopRect = (x: number, yTop: number, width: number, height: number) => {
    p14.drawRectangle({ x, y: p14.getHeight() - yTop - height, width, height, color: white })
  }
  const drawParagraph = (text: string, x: number, yTop: number, maxChars: number, maxLines: number) => {
    const lines = wrapText(text, maxChars).slice(0, maxLines)
    lines.forEach((line, idx) => drawAtTop(13, line, x, yTop + idx * 16.5, 9.2))
  }

  coverTopRect(69, 184, 456, 101)
  drawParagraph(obs.reflection1, 75, 191, 92, 5)
  coverTopRect(69, 350, 456, 101)
  drawParagraph(obs.reflection2, 75, 358, 92, 5)
  coverTopRect(69, 529, 456, 62)
  drawParagraph(obs.observerSummary, 75, 535, 92, 3)
  p14.drawRectangle({ x: 150, y: p14.getHeight() - 704, width: 150, height: 28, color: white })
  drawAtTop(13, formatDateMY(obs.observationDate), 160, 683, 9.2, true)

  const bytes = await pdf.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
