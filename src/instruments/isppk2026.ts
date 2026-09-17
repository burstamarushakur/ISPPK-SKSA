import type { InstrumentVersion, RubricItem, StudentItem } from '../lib/types'

const fourPoint = (thing: string) => [
  `Guru melaksanakan ${thing} TANPA mana-mana perkara yang dinyatakan.`,
  `Guru melaksanakan ${thing} bagi mana-mana satu (1) perkara.`,
  `Guru melaksanakan ${thing} bagi mana-mana dua (2) perkara.`,
  `Guru melaksanakan ${thing} bagi mana-mana tiga (3) perkara.`,
  `Guru melaksanakan ${thing} bagi semua empat (4) perkara.`
]

const fivePoint = (thing: string) => [
  `Guru melaksanakan ${thing} bagi mana-mana satu (1) perkara.`,
  `Guru melaksanakan ${thing} bagi mana-mana dua (2) perkara.`,
  `Guru melaksanakan ${thing} bagi mana-mana tiga (3) perkara.`,
  `Guru melaksanakan ${thing} bagi mana-mana empat (4) perkara.`,
  `Guru melaksanakan ${thing} bagi semua lima (5) perkara.`
]

const teacherRubric: RubricItem[] = [
  {
    id: '1.1', domain: 'planning', skas: '4.1',
    title: 'Menetapkan objektif PdP bercirikan KBAT',
    criteria: ['Eksplisit dan jelas.', 'Mengikut pelbagai tahap keupayaan/penguasaan murid.', 'Mengikut peruntukan masa yang ditetapkan.', 'Mematuhi ketetapan kurikulum.'],
    scoreDescriptions: fourPoint('perancangan objektif PdP bercirikan KBAT')
  },
  {
    id: '1.2', domain: 'planning', skas: '4.1',
    title: 'Merancang set induksi yang menggalakkan KBAT dalam PdP',
    criteria: ['Mengikut pelbagai aras keupayaan murid.', 'Mengambil kira pengetahuan sedia ada.', 'Berupaya menarik minat murid.', 'Mengikut peruntukan masa yang ditetapkan.'],
    scoreDescriptions: fourPoint('set induksi yang sesuai dan menggalakkan KBAT dalam PdP')
  },
  {
    id: '1.3', domain: 'planning', skas: '4.1',
    title: 'Merancang aktiviti pembelajaran yang berpusatkan murid berdasarkan objektif PdP',
    criteria: ['Mengikut pelbagai aras keupayaan murid.', 'Mengikut peruntukan masa yang ditetapkan.', 'Mematuhi ketetapan kurikulum.', 'Menerapkan penggunaan alat berfikir.'],
    scoreDescriptions: fourPoint('aktiviti pembelajaran berpusatkan murid berdasarkan objektif PdP')
  },
  {
    id: '1.4', domain: 'planning', skas: '4.1',
    title: 'Merancang pentaksiran yang bercirikan KBAT',
    criteria: ['Eksplisit dan jelas.', 'Mengikut pelbagai tahap keupayaan/penguasaan murid.', 'Mengikut peruntukan masa yang ditetapkan.', 'Mematuhi ketetapan kurikulum.'],
    scoreDescriptions: fourPoint('pentaksiran yang bercirikan KBAT')
  },
  {
    id: '2.1', domain: 'implementation', skas: '4.2 / 4.3 / 4.4',
    title: 'Menyediakan persekitaran PdP yang kondusif',
    criteria: ['Mewujudkan suasana pembelajaran yang menyeronokkan.', 'Menyusun atur kedudukan murid.', 'Mengawasi perlakuan murid.', 'Mengawasi komunikasi murid.'],
    scoreDescriptions: fourPoint('persekitaran PdP yang kondusif')
  },
  {
    id: '2.2', domain: 'implementation', skas: '4.2 / 4.3 / 4.4',
    title: 'Melibatkan murid secara aktif dalam PdP / PdP berpusatkan murid',
    criteria: ['Memberi tunjuk ajar/tunjuk cara/panduan menguasai isi pelajaran/konsep/fakta berkaitan pelajaran.', 'Memberi tunjuk ajar/tunjuk cara/panduan menguasai kemahiran dalam aktiviti pembelajaran.', 'Mendorong murid membuat keputusan dan menyelesaikan masalah dalam aktiviti pembelajaran.', 'Mendorong murid menggunakan/memanfaatkan sumber pendidikan berkaitan pelajaran.', 'Menggabung/merentas/mengaitkan isi pelajaran dengan tajuk/unit/tema/nilai/kemahiran/mata pelajaran lain dalam aktiviti pembelajaran.'],
    scoreDescriptions: fivePoint('penglibatan murid secara aktif dalam PdP berpusatkan murid')
  },
  {
    id: '2.3', domain: 'implementation', skas: '4.2 / 4.3 / 4.4',
    title: 'Menggunakan teknik penyoalan yang menggalakkan murid berfikir',
    criteria: ['Merangsang murid berkomunikasi.', 'Merangsang murid berkolaboratif dalam aktiviti pembelajaran.', 'Mengemukakan soalan yang merangsang pemikiran kritis dan kreatif ke arah membuat keputusan dan menyelesaikan masalah.', 'Menggalakkan murid mengemukakan soalan berkaitan isi pelajaran.', 'Menggalakkan murid memperoleh pengetahuan dan kemahiran secara kendiri.'],
    scoreDescriptions: fivePoint('teknik penyoalan yang menggalakkan murid berfikir')
  },
  {
    id: '2.4', domain: 'implementation', skas: '4.2 / 4.3 / 4.4',
    title: 'Menggunakan alat berfikir semasa PdP',
    criteria: ['Merangsang murid berkomunikasi.', 'Merangsang murid berkolaboratif dalam aktiviti pembelajaran.', 'Mengemukakan soalan yang menjurus ke arah pemikiran kritis dan kreatif, membuat keputusan dan menyelesaikan masalah.', 'Menggalakkan murid mengemukakan soalan berkaitan isi pelajaran.', 'Menggalakkan murid memperoleh pengetahuan dan kemahiran secara kendiri.'],
    scoreDescriptions: fivePoint('penggunaan alat berfikir semasa PdP')
  },
  {
    id: '2.5', domain: 'implementation', skas: '4.5',
    title: 'Melaksanakan pentaksiran bercirikan KBAT',
    criteria: ['Menggunakan pelbagai kaedah pentaksiran.', 'Menjalankan aktiviti pemulihan/pengayaan.', 'Memberi latihan/tugasan berkaitan pelajaran.', 'Menyemak/menilai hasil kerja/gerak kerja/latihan/tugasan.'],
    scoreDescriptions: fourPoint('pentaksiran bercirikan KBAT')
  },
  {
    id: '3.1', domain: 'reflection', skas: '4.5',
    title: 'Melaksanakan refleksi PdP',
    criteria: ['Guru mempraktikkan amalan refleksi dalam PdP.', 'Berdasarkan objektif pembelajaran.', 'Guru menilai kelemahan dan kekuatan PdP dengan jelas.', 'Guru mengenal pasti tindakan susulan untuk penambahbaikan dan pemantapan PdP.'],
    scoreDescriptions: fourPoint('refleksi PdP')
  }
]

const studentRubric: StudentItem[] = [
  { id: 'M1', title: 'Murid memberikan pendapat yang munasabah dan logik berkaitan isi pelajaran semasa PdP.' },
  { id: 'M2', title: 'Murid berupaya memberi respon terhadap soalan yang dikemukakan oleh guru dan/atau rakan.' },
  { id: 'M3', title: 'Murid memberi galakan kepada rakan yang lain untuk aktif berkongsi pendapat semasa PdP.' },
  { id: 'M4', title: 'Murid menunjukkan kecenderungan pembelajaran kendiri semasa PdP.' },
  { id: 'M5', title: 'Murid berjaya menyelesaikan tugasan semasa aktiviti PdP.' },
  { id: 'M6', title: 'Murid boleh menghubung kait antara pengetahuan sedia ada dengan pengetahuan baharu.' },
  { id: 'M7', title: 'Murid berupaya menggunakan alat berfikir yang bersesuaian semasa aktiviti PdP.' },
  { id: 'M8', title: 'Murid dapat mengaplikasikan nilai murni semasa PdP.' },
  { id: 'M9', title: 'Murid mampu menilai hasil kerja sendiri/rakan dan membuat penambahbaikan berdasarkan penilaian yang dibuat.' },
  { id: 'M10', title: 'Murid bertanya soalan kepada guru dan/atau rakan.' }
]

export const ISPPK_2026: InstrumentVersion = {
  id: 'isppk-pdp-2026-v1',
  year: 2026,
  code: 'ISPPK-PDP-2026-V1',
  title: 'Instrumen Standard Penilaian Pembudayaan Kemahiran Berfikir Aras Tinggi (KBAT) dalam Pengajaran dan Pembelajaran (Guru & Murid) Tahun 2026',
  shortTitle: 'ISPPK PdP Guru & Murid 2026',
  description: 'Versi rasmi 2026 yang menjadi versi pertama dalam sistem multi-tahun SK Sungai Abong.',
  active: true,
  isDefault: true,
  teacherRubric,
  studentRubric,
  scoreLabels: ['KESEDARAN', 'ASAS', 'PERTENGAHAN', 'LANJUTAN', 'PAKAR'],
  studentScoreGuide: ['1% - 20%', '21% - 40%', '41% - 60%', '61% - 80%', '81% - 100%'],
  domains: [
    { id: 'planning', label: 'Perancangan', itemIds: ['1.1','1.2','1.3','1.4'], maxScore: 20 },
    { id: 'implementation', label: 'Pelaksanaan', itemIds: ['2.1','2.2','2.3','2.4','2.5'], maxScore: 25 },
    { id: 'reflection', label: 'Refleksi', itemIds: ['3.1'], maxScore: 5 }
  ],
  studentMaxScore: 50,
  totalMaxScore: 100,
  achievementBands: [
    { min: 0, max: 40, label: 'Tidak memenuhi tahap minimum pembudayaan KBAT dalam PdP.' },
    { min: 41, max: 50, label: 'Telah mencapai tahap minimum pembudayaan KBAT dalam PdP serta boleh dibimbing untuk penambahbaikan.' },
    { min: 51, max: 60, label: 'Telah mencapai tahap sederhana pembudayaan KBAT dalam PdP serta boleh dibimbing untuk penambahbaikan.' },
    { min: 61, max: 80, label: 'Telah mencapai tahap baik pembudayaan KBAT dalam PdP.' },
    { min: 81, max: 100, label: 'Telah membudayakan KBAT dalam PdP secara cemerlang, konsisten dan menyeluruh.' }
  ],
  templatePdfPath: '/templates/2026/ISPPK.pdf',
  pdfLayoutKey: 'isppk-pdp-2026',
  googleFormMapping: {
    formId: '1FAIpQLSf5spNOHshC3fg_gPcWnU_qvZ6JxHXmu7Ini5c8dTPeQgYucw',
    title: 'Pengumpulan Skor ISPPK KBAT (Guru dan Murid) Tahun 2026',
    fixed: {
      state: { entry: 'entry.239349717', value: 'JOHOR' },
      ppd: { entry: 'entry.934737966', value: 'MUAR' },
      school: { entry: 'entry.35170183', value: 'JBA5095 SEKOLAH KEBANGSAAN SUNGAI ABONG' }
    },
    fields: {
      observationDate: 'entry.1318149698',
      teacherName: 'entry.974514806',
      gender: 'entry.2059299346',
      optionName: 'entry.250639074',
      subject: 'entry.1067028718',
      attendanceBucket: 'entry.239647449',
      levelBucket: 'entry.928460574',
      className: 'entry.691390932',
      topic: 'entry.1076597618',
      pdpTime: 'entry.137993890',
      planningScore: 'entry.276564800',
      implementationScore: 'entry.431081358',
      reflectionScore: 'entry.877415289',
      studentScore: 'entry.1234919513'
    },
    note: 'Diekstrak daripada source Google Form yang diberikan untuk tahun 2026. Extension mesti semak Form ID dan fingerprint struktur sebelum autofill.'
  },
  sourceNote: 'Dikonfigurasi berdasarkan V2 Borang Instrumen ISPPK 2026 (Guru & Murid) yang dibekalkan.'
}
