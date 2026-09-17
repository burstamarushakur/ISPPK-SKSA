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

async function transparentSignatureBytes(dataUrl: string) {
  const raw = Uint8Array.from(atob(dataUrl.split(',')[1] || ''), c => c.charCodeAt(0))
  // Tandatangan baharu daripada SignaturePad memang alpha-transparent. Fungsi ini juga
  // membersihkan tandatangan lama yang pernah disimpan dengan latar putih supaya
  // PDF rasmi di bawahnya tidak ditutup.
  if (typeof document === 'undefined' || typeof Image === 'undefined') return raw
  try {
    const img = new Image()
    img.src = dataUrl
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('signature image load failed')) })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, img.naturalWidth || img.width)
    canvas.height = Math.max(1, img.naturalHeight || img.height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return raw
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const px = image.data
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3]
      if (!a) continue
      const lo = Math.min(r, g, b), hi = Math.max(r, g, b)
      // Putih/kelabu cerah daripada canvas lama ditukar kepada alpha. Untuk piksel
      // antialias kelabu, kurangkan alpha secara beransur supaya tepi dakwat kekal licin.
      if (lo >= 244 && hi - lo <= 18) px[i + 3] = 0
      else if (lo >= 185 && hi - lo <= 18) px[i + 3] = Math.round(a * (244 - lo) / 59)
    }
    ctx.putImageData(image, 0, 0)

    // Crop ruang alpha kosong supaya tandatangan tidak menjadi terlalu kecil bila diskalakan.
    const cleaned = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (cleaned.data[(y * canvas.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
    }
    if (maxX < 0 || maxY < 0) return raw
    const pad = 8
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad)
    maxX = Math.min(canvas.width - 1, maxX + pad); maxY = Math.min(canvas.height - 1, maxY + pad)
    const out = document.createElement('canvas')
    out.width = maxX - minX + 1; out.height = maxY - minY + 1
    const outCtx = out.getContext('2d')
    if (!outCtx) return raw
    outCtx.putImageData(ctx.getImageData(minX, minY, out.width, out.height), 0, 0)
    const blob = await new Promise<Blob | null>(resolve => out.toBlob(resolve, 'image/png'))
    return blob ? new Uint8Array(await blob.arrayBuffer()) : raw
  } catch {
    return raw
  }
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
  const highlightFill = rgb(1, 0.82, 0.30)
  const highlightBorder = rgb(0.73, 0.49, 0.08)

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

  // Highlight pilihan tanpa menutup teks asal. Ini meniru PDF rasmi daripada laman
  // ISPPK: sel dipilih diberi latar kuning lembut + bingkai, bukannya tanda X.
  const highlightTopRect = (pageIndex: number, x1: number, x2: number, yTop1: number, yTop2: number) => {
    const page = pages[pageIndex]
    const inset = 1.0
    page.drawRectangle({
      x: x1 + inset,
      y: page.getHeight() - yTop2 + inset,
      width: Math.max(1, x2 - x1 - inset * 2),
      height: Math.max(1, yTop2 - yTop1 - inset * 2),
      color: highlightFill,
      opacity: 0.20,
      borderColor: highlightBorder,
      borderWidth: 1.35,
      borderOpacity: 0.95
    })
  }

  // Bahagian A - D
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

  // Bahagian C - Jantina. Bounding box teks pada template rasmi 2026:
  // Lelaki x=207.75..236.47, Perempuan x=245.63..302.47, y(top)=485.82..498.11.
  // Bulatkan perkataan yang dipilih sahaja - tiada tanda pangkah.
  const genderPage = pages[2]
  const female = obs.gender === 'Perempuan'
  const gx1 = female ? 245.63 : 207.75
  const gx2 = female ? 302.47 : 236.47
  const gy1 = 485.82, gy2 = 498.11
  genderPage.drawEllipse({
    x: (gx1 + gx2) / 2,
    y: genderPage.getHeight() - ((gy1 + gy2) / 2),
    xScale: (gx2 - gx1) / 2 + 3.2,
    yScale: (gy2 - gy1) / 2 + 2.4,
    borderColor: black,
    borderWidth: 1.15,
    borderOpacity: 0.95
  })
  drawAtTop(2, (obs.optionName || teacher.optionName || '').toUpperCase(), 210, 514, 8.2, false, 300)

  drawAtTop(2, subject.name.toUpperCase(), 208, 596, 8.1, true, 305)
  pages[2].drawRectangle({ x: 201, y: pages[2].getHeight() - 648, width: 320, height: 23, color: white })
  drawAtTop(2, `${obs.studentsPresent ?? ''} / ${obs.studentsTotal ?? ''} ORANG`, 210, 631, 8.2, true, 295)
  drawAtTop(2, `TAHUN ${schoolClass.year} - ${schoolClass.name}`.toUpperCase(), 208, 656, 8.2, true, 305)
  drawAtTop(2, obs.topic.toUpperCase(), 208, 684, 8.0, false, 305)
  drawAtTop(2, formatTime(obs.pdpTime), 208, 711, 8.2, true)

  // Bahagian E - Rubrik Guru. Sesetengah item bersambung ke muka surat seterusnya,
  // jadi semua serpihan sel yang dipilih turut di-highlight.
  const scoreColumns: Array<[number, number]> = [
    [267.5, 366.5], [366.5, 466.5], [466.5, 566.5], [566.5, 666.5], [666.5, 765.5]
  ]
  const teacherFragments: Record<string, Array<[number, number, number]>> = {
    '1.1': [[3, 255.5, 427.5]],
    '1.2': [[3, 427.5, 517.5], [4, 72.5, 238.5]],
    '1.3': [[4, 238.5, 449.5]],
    '1.4': [[4, 449.5, 517.0], [5, 72.5, 272.5]],
    '2.1': [[5, 295.5, 504.5]],
    '2.2': [[6, 140.5, 514.5], [7, 72.5, 184.5]],
    '2.3': [[7, 184.5, 506.5], [8, 72.5, 140.5]],
    '2.4': [[8, 140.5, 512.5], [9, 72.5, 140.5]],
    '2.5': [[9, 140.5, 507.5], [10, 72.5, 162.5]],
    '3.1': [[10, 162.5, 369.5]]
  }
  for (const [id, scoreRaw] of Object.entries(obs.selfTeacherScores)) {
    const score = Number(scoreRaw)
    if (score < 1 || score > 5) continue
    const col = scoreColumns[score - 1]
    if (!col) continue
    for (const [pageIndex, y1, y2] of teacherFragments[id] || []) highlightTopRect(pageIndex, col[0], col[1], y1, y2)
  }

  // Bahagian F - Rubrik Murid. Guna highlight yang sama, bukan tanda X.
  const studentColumns: Array<[number, number]> = [
    [406.5, 429.5], [429.5, 451.5], [451.5, 474.5], [474.5, 496.5], [496.5, 519.5]
  ]
  const studentRows: Array<[number, number]> = [
    [311.5, 349.5], [349.5, 386.5], [386.5, 424.5], [424.5, 462.5], [462.5, 499.5],
    [499.5, 539.5], [539.5, 577.5], [577.5, 617.5], [617.5, 669.5], [669.5, 707.5]
  ]
  instrument.studentRubric.slice(0, 10).forEach((item, index) => {
    const score = Number(obs.selfStudentScores[item.id])
    const col = studentColumns[score - 1]
    const row = studentRows[index]
    if (col && row) highlightTopRect(11, col[0], col[1], row[0], row[1])
  })

  // Bahagian G - Pengiraan skor
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

  // Bahagian H/I
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

  if (obs.observerSignatureDataUrl?.startsWith('data:image/png;base64,')) {
    try {
      const sigBytes = await transparentSignatureBytes(obs.observerSignatureDataUrl)
      const sig = await pdf.embedPng(sigBytes)
      const dims = sig.scaleToFit(150, 58)
      // TIADA kotak putih di belakang. Hanya dakwat tandatangan PNG alpha-transparent
      // dilukis di atas garisan asal PDF.
      p14.drawImage(sig, { x: 150, y: p14.getHeight() - 668, width: dims.width, height: dims.height })
    } catch {}
  }

  p14.drawRectangle({ x: 150, y: p14.getHeight() - 704, width: 150, height: 28, color: white })
  const signedDate = obs.observerSignedAt ? obs.observerSignedAt.slice(0,10) : obs.observationDate
  drawAtTop(13, formatDateMY(signedDate), 160, 683, 9.2, true)

  const bytes = await pdf.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
