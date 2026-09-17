import type { InstrumentVersion, RubricItem, StudentItem } from '../lib/types'

const teacherRubric: RubricItem[] = [
  {
    id:'1.1', domain:'planning', skas:'4.1',
    title:'Menetapkan objektif PdP bercirikan KBAT seperti berikut:',
    criteria:['Eksplisit dan jelas.','Mengikut pelbagai tahap keupayaan/penguasaan murid.','Mengikut peruntukan masa yang ditetapkan.','Mematuhi ketetapan kurikulum.'],
    scoreDescriptions:[
      'Guru kurang berkemampuan merancang objektif PdP bercirikan KBAT.',
      'Guru merancang objektif PdP bercirikan KBAT bagi mana-mana satu (1) daripada perkara i, ii, iii dan iv.',
      'Guru merancang objektif PdP bercirikan KBAT bagi mana-mana dua (2) daripada perkara i, ii, iii dan iv.',
      'Guru merancang objektif PdP bercirikan KBAT bagi mana-mana tiga (3) daripada perkara i, ii, iii dan iv.',
      'Guru merancang objektif PdP bercirikan KBAT bagi semua empat (4) perkara berkenaan.'
    ]
  },
  {
    id:'1.2', domain:'planning', skas:'4.1',
    title:'Merancang set induksi yang sesuai dengan latar belakang murid, pengetahuan sedia ada dan menggalakkan KBAT dalam PdP.',
    criteria:['Mengikut pelbagai aras keupayaan murid.','Mengikut peruntukan masa yang ditetapkan.','Berupaya menarik minat murid.'],
    scoreDescriptions:[
      'Guru tidak merancang set induksi.',
      'Guru kurang berkemampuan merancang set induksi yang sesuai.',
      'Guru merancang set induksi yang sesuai dan menggalakkan KBAT dalam PdP bagi mana-mana satu (1) daripada perkara i, ii dan iii.',
      'Guru merancang set induksi yang sesuai dan menggalakkan KBAT dalam PdP bagi mana-mana dua (2) daripada perkara i, ii dan iii.',
      'Guru merancang set induksi yang sesuai dan menggalakkan KBAT dalam PdP bagi semua tiga (3) perkara berkenaan.'
    ]
  },
  {
    id:'1.3', domain:'planning', skas:'4.1',
    title:'Merancang aktiviti pembelajaran yang berpusatkan murid berdasarkan kepada objektif PdP.',
    criteria:['Mengikut pelbagai aras keupayaan murid.','Mengikut peruntukan masa yang ditetapkan.','Mematuhi ketetapan kurikulum.'],
    scoreDescriptions:[
      'Guru tidak merancang aktiviti pembelajaran yang berpusatkan murid berdasarkan kepada objektif PdP.',
      'Guru kurang berkemampuan merancang aktiviti pembelajaran yang berpusatkan murid berdasarkan objektif PdP.',
      'Guru merancang aktiviti pembelajaran yang berpusatkan murid berdasarkan objektif PdP bagi mana-mana satu (1) daripada perkara i, ii dan iii.',
      'Guru merancang aktiviti pembelajaran yang berpusatkan murid berdasarkan objektif PdP bagi mana-mana dua (2) daripada perkara i, ii dan iii.',
      'Guru merancang aktiviti pembelajaran yang berpusatkan murid berdasarkan objektif PdP bagi semua tiga (3) perkara berkenaan.'
    ]
  },
  {
    id:'1.4', domain:'planning', skas:'4.1',
    title:'Merancang kaedah pentaksiran yang bercirikan KBAT.',
    criteria:['Eksplisit dan jelas.','Mengikut pelbagai tahap keupayaan/penguasaan murid.','Mengikut peruntukan masa yang ditetapkan.','Mematuhi ketetapan kurikulum.'],
    scoreDescriptions:[
      'Guru kurang berkemampuan merancang kaedah pentaksiran yang bercirikan KBAT.',
      'Guru merancang kaedah pentaksiran yang bercirikan KBAT bagi mana-mana satu (1) daripada perkara i, ii, iii dan iv.',
      'Guru merancang kaedah pentaksiran yang bercirikan KBAT bagi mana-mana dua (2) daripada perkara i, ii, iii dan iv.',
      'Guru merancang kaedah pentaksiran yang bercirikan KBAT bagi mana-mana tiga (3) daripada perkara i, ii, iii dan iv.',
      'Guru merancang kaedah pentaksiran yang bercirikan KBAT bagi semua empat (4) perkara berkenaan.'
    ]
  },
  {
    id:'2.1', domain:'implementation', skas:'4.2 / 4.3 / 4.4',
    title:'Menyediakan persekitaran PdP yang kondusif.',
    criteria:['Mewujudkan suasana pembelajaran yang menyeronokkan.','Menyusun atur kedudukan murid.','Mengawasi perlakuan dan komunikasi murid.'],
    scoreDescriptions:[
      'Guru tidak menyediakan persekitaran PdP yang kondusif.',
      'Guru menyediakan persekitaran PdP yang kondusif bagi mana-mana satu (1) daripada perkara i, ii dan iii.',
      'Guru menyediakan persekitaran PdP yang kondusif bagi perkara i dan ii.',
      'Guru menyediakan persekitaran PdP yang kondusif bagi perkara i dan iii.',
      'Guru menyediakan persekitaran PdP yang kondusif bagi semua tiga (3) perkara berkenaan.'
    ]
  },
  {
    id:'2.2', domain:'implementation', skas:'4.2 / 4.3 / 4.4',
    title:'Melibatkan murid secara aktif dalam PdP/PdP berpusatkan murid.',
    criteria:[
      'Memberi tunjuk ajar/tunjuk cara/panduan menguasai isi pelajaran/konsep/fakta berkaitan pelajaran.',
      'Memberi tunjuk ajar/tunjuk cara/panduan menguasai kemahiran dalam aktiviti pembelajaran.',
      'Memandu murid membuat keputusan dan menyelesaikan masalah dalam aktiviti pembelajaran.',
      'Memandu murid menggunakan/memanfaatkan sumber pendidikan berkaitan pelajaran.',
      'Menggabung/merentas/mengaitkan isi pelajaran dengan tajuk/unit/tema/nilai/kemahiran/mata pelajaran lain dalam aktiviti pembelajaran.'
    ],
    scoreDescriptions:[
      'Guru melibatkan murid secara aktif dalam PdP/PdP berpusatkan murid bagi mana-mana satu (1) daripada perkara i, ii, iii, iv dan v.',
      'Guru melibatkan murid secara aktif dalam PdP/PdP berpusatkan murid bagi mana-mana dua (2) daripada perkara i, ii, iii, iv dan v.',
      'Guru melibatkan murid secara aktif dalam PdP/PdP berpusatkan murid bagi mana-mana tiga (3) daripada perkara i, ii, iii, iv dan v.',
      'Guru melibatkan murid secara aktif dalam PdP/PdP berpusatkan murid bagi mana-mana empat (4) daripada perkara i, ii, iii, iv dan v.',
      'Guru melibatkan murid secara aktif dalam PdP/PdP berpusatkan murid bagi semua lima (5) perkara berkenaan.'
    ]
  },
  {
    id:'2.3', domain:'implementation', skas:'4.2 / 4.3 / 4.4',
    title:'Menggunakan teknik penyoalan yang menggalakkan murid berfikir.',
    criteria:[
      'Merangsang murid berkomunikasi.',
      'Merangsang murid berkolaboratif dalam aktiviti pembelajaran.',
      'Mengemukakan soalan yang merangsang pemikiran kritis dan kreatif.',
      'Mengajukan soalan/mewujudkan situasi yang menjurus ke arah membuat keputusan dan menyelesaikan masalah.',
      'Mewujudkan peluang untuk murid memimpin.',
      'Menggalakkan murid mengemukakan soalan berkaitan isi pelajaran.',
      'Menggalakkan murid memperoleh pengetahuan dan kemahiran secara kendiri.'
    ],
    scoreDescriptions:[
      'Guru menggunakan teknik penyoalan yang menggalakkan murid berfikir bagi mana-mana satu (1) daripada perkara i, ii, iii, iv, v, vi dan vii.',
      'Guru menggunakan teknik penyoalan yang menggalakkan murid berfikir bagi mana-mana dua (2) daripada perkara i, ii, iii, iv, v, vi dan vii.',
      'Guru menggunakan teknik penyoalan yang menggalakkan murid berfikir bagi mana-mana tiga (3) daripada perkara i, ii, iii, iv, v, vi dan vii.',
      'Guru menggunakan teknik penyoalan yang menggalakkan murid berfikir bagi mana-mana lima (5) daripada perkara i, ii, iii, iv, v, vi dan vii.',
      'Guru menggunakan teknik penyoalan yang menggalakkan murid berfikir bagi semua tujuh (7) perkara berkenaan.'
    ]
  },
  {
    id:'2.4', domain:'implementation', skas:'4.2 / 4.3 / 4.4',
    title:'Menggunakan alat berfikir semasa PdP.',
    criteria:[
      'Merangsang murid berkomunikasi.',
      'Merangsang murid berkolaboratif dalam aktiviti pembelajaran.',
      'Mengemukakan soalan yang menjurus ke arah pemikiran kritis dan kreatif.',
      'Mengajukan soalan/mewujudkan situasi yang menjurus ke arah membuat keputusan dan menyelesaikan masalah.',
      'Mewujudkan peluang untuk murid memimpin.',
      'Menggalakkan murid mengemukakan soalan berkaitan isi pelajaran.',
      'Menggalakkan murid memperoleh pengetahuan dan kemahiran secara kendiri.'
    ],
    scoreDescriptions:[
      'Guru kurang berkemampuan menggunakan alat berfikir semasa PdP.',
      'Guru menggunakan alat berfikir semasa PdP bagi mana-mana satu (1) atau dua (2) daripada perkara i, ii, iii, iv, v, vi dan vii.',
      'Guru menggunakan alat berfikir semasa PdP bagi mana-mana tiga (3) atau empat (4) daripada perkara i, ii, iii, iv, v, vi dan vii.',
      'Guru menggunakan alat berfikir semasa PdP bagi mana-mana lima (5) atau enam (6) daripada perkara i, ii, iii, iv, v, vi dan vii.',
      'Guru menggunakan alat berfikir semasa PdP bagi semua tujuh (7) perkara berkenaan.'
    ]
  },
  {
    id:'2.5', domain:'implementation', skas:'4.5',
    title:'Melaksanakan pentaksiran bercirikan KBAT.',
    criteria:['Menggunakan pelbagai kaedah pentaksiran.','Menjalankan aktiviti pemulihan/pengayaan.','Memberi latihan/tugasan berkaitan pelajaran.','Membuat refleksi PdP.','Menyemak/menilai hasil kerja/gerak kerja/latihan/tugasan.'],
    scoreDescriptions:[
      'Guru kurang berkemampuan melaksanakan pentaksiran bercirikan KBAT.',
      'Guru melaksanakan pentaksiran bercirikan KBAT bagi mana-mana satu (1) daripada perkara i, ii, iii, iv dan v.',
      'Guru melaksanakan pentaksiran bercirikan KBAT bagi mana-mana dua (2) daripada perkara i, ii, iii, iv dan v.',
      'Guru melaksanakan pentaksiran bercirikan KBAT bagi mana-mana tiga (3) atau empat (4) daripada perkara i, ii, iii, iv dan v.',
      'Guru melaksanakan pentaksiran bercirikan KBAT bagi semua lima (5) perkara berkenaan.'
    ]
  },
  {
    id:'3.1', domain:'reflection', skas:'4.5',
    title:'Melaksanakan refleksi PdP.',
    criteria:['Guru menilai kelemahan dan kekuatan PdP.','Guru menilai kelemahan dan kekuatan PdP dengan jelas.','Guru mengenal pasti tindakan susulan untuk penambahbaikan dan pemantapan PdP.','Guru mempraktikkan amalan refleksi dalam PdP.'],
    scoreDescriptions:[
      'Guru kurang berkemampuan melaksanakan refleksi PdP.',
      'Guru melaksanakan refleksi PdP bagi mana-mana satu (1) daripada perkara i, ii, iii dan iv.',
      'Guru melaksanakan refleksi PdP bagi mana-mana dua (2) daripada perkara i, ii, iii dan iv.',
      'Guru melaksanakan refleksi PdP bagi mana-mana tiga (3) daripada perkara i, ii, iii dan iv.',
      'Guru melaksanakan refleksi PdP bagi semua empat (4) perkara berkenaan.'
    ]
  }
]

const studentRubric: StudentItem[] = [
  {id:'M1', teacherItemRef:'2.2', title:'Murid dapat melibatkan diri dalam aktiviti PdPc secara aktif.'},
  {id:'M2', teacherItemRef:'2.2', title:'Murid memberikan pendapat yang bernas semasa aktiviti PdPc.'},
  {id:'M3', teacherItemRef:'2.2', title:'Murid mempamerkan keupayaan kendiri semasa melaksanakan aktiviti PdPc.'},
  {id:'M4', teacherItemRef:'2.2', title:'Murid memberi galakan kepada rakan yang lain untuk aktif berkongsi pendapat semasa PdPc.'},
  {id:'M5', teacherItemRef:'2.2', title:'Murid menunjukkan kecenderungan pembelajaran kendiri semasa PdPc.'},
  {id:'M6', teacherItemRef:'2.3', title:'Murid berjaya menyelesaikan masalah semasa aktiviti PdPc.'},
  {id:'M7', teacherItemRef:'2.3', title:'Murid berupaya memberi respon terhadap soalan yang dikemukakan oleh guru dan/atau rakan.'},
  {id:'M8', teacherItemRef:'2.3', title:'Murid boleh menghubungkait antara pengetahuan sedia ada dengan pengetahuan baharu.'},
  {id:'M9', teacherItemRef:'2.4', title:'Murid berkeyakinan menggunakan alat berfikir semasa aktiviti PdPc.'},
  {id:'M10', teacherItemRef:'2.5', title:'Murid mampu memberi respon mengenai perkara yang dibincangkan semasa PdPc.'},
  {id:'M11', teacherItemRef:'2.5', title:'Murid dapat mengaplikasikan nilai murni semasa PdPc.'},
  {id:'M12', teacherItemRef:'2.2', title:'Murid mampu menilai hasil kerja sendiri.'},
  {id:'M13', teacherItemRef:'2.2', title:'Murid berupaya membuat penambahbaikan atas tugasan yang telah dinilai.'},
  {id:'M14', teacherItemRef:'2.3', title:'Murid bertanya soalan kepada guru dan/atau rakan.'}
]

const teacherBands = [
  {min:0,max:40,label:'Tidak memenuhi tahap minimum pembudayaan KBAT dalam PdP oleh guru.'},
  {min:41,max:50,label:'Telah mencapai tahap minimum pembudayaan KBAT dalam PdP oleh guru serta boleh dibimbing seterusnya.'},
  {min:51,max:60,label:'Telah mencapai tahap sederhana pembudayaan KBAT dalam PdP oleh guru serta boleh dibimbing seterusnya.'},
  {min:61,max:80,label:'Telah mencapai tahap baik pembudayaan KBAT dalam PdP oleh guru.'},
  {min:81,max:100,label:'Telah membudayakan KBAT dalam PdP oleh guru dengan cemerlang dan layak diberi penarafan.'}
]

const studentBands = [
  {min:0,max:40,label:'Tidak memenuhi tahap minimum pembudayaan KBAT dalam PdP oleh murid.'},
  {min:41,max:50,label:'Telah mencapai tahap minimum pembudayaan KBAT dalam PdP oleh murid serta boleh dibimbing seterusnya.'},
  {min:51,max:60,label:'Telah mencapai tahap sederhana pembudayaan KBAT dalam PdP oleh murid serta boleh dibimbing seterusnya.'},
  {min:61,max:80,label:'Telah mencapai tahap baik pembudayaan KBAT dalam PdP oleh murid.'},
  {min:81,max:100,label:'Telah membudayakan KBAT dalam PdP oleh murid dengan cemerlang dan layak diberi penarafan.'}
]

export const ISPPK_2026: InstrumentVersion = {
  id:'isppk-pdp-2026-v1', year:2026, code:'ISPPK-PDP-2026-V1',
  title:'Instrumen Standard Penilaian Pembudayaan Kemahiran Berfikir Aras Tinggi (KBAT) dalam Pengajaran dan Pembelajaran (Guru & Murid)',
  shortTitle:'ISPPK PdP Guru & Murid 2026',
  description:'Struktur pengisian mengikut borang Guru dan Murid yang dibekalkan, termasuk Bahagian A-D, rubrik, skor, refleksi dan rumusan.',
  active:true, isDefault:true,
  teacherRubric, studentRubric,
  scoreLabels:['KESEDARAN','ASAS','PERTENGAHAN','LANJUTAN','PAKAR'],
  studentScoreGuide:[
    'Skor 1: 1% - 20% bilangan murid mencapai item di bawah',
    'Skor 2: 21% - 40% bilangan murid mencapai item di bawah',
    'Skor 3: 41% - 60% bilangan murid mencapai item di bawah',
    'Skor 4: 61% - 80% bilangan murid mencapai item di bawah',
    'Skor 5: 81% - 100% bilangan murid mencapai item di bawah'
  ],
  domains:[
    {id:'planning',label:'Perancangan',itemIds:['1.1','1.2','1.3','1.4'],maxScore:20},
    {id:'implementation',label:'Pelaksanaan',itemIds:['2.1','2.2','2.3','2.4','2.5'],maxScore:25},
    {id:'reflection',label:'Refleksi',itemIds:['3.1'],maxScore:5}
  ],
  studentMaxScore:70,
  totalMaxScore:120,
  achievementBands:teacherBands,
  studentAchievementBands:studentBands,
  templatePdfPath:'/templates/2026/ISPPK-Guru.pdf',
  studentTemplatePdfPath:'/templates/2026/ISPPK-Murid.pdf',
  pdfLayoutKey:'isppk-guru-murid-separate',
  googleFormMapping:{
    formId:'1FAIpQLSf5spNOHshC3fg_gPcWnU_qvZ6JxHXmu7Ini5c8dTPeQgYucw',
    title:'Pengumpulan Skor ISPPK KBAT (Guru dan Murid) Tahun 2026',
    fixed:{state:{entry:'entry.239349717',value:'JOHOR'},ppd:{entry:'entry.934737966',value:'MUAR'},school:{entry:'entry.35170183',value:'JBA5095 SEKOLAH KEBANGSAAN SUNGAI ABONG'}},
    fields:{observationDate:'entry.1318149698',teacherName:'entry.974514806',gender:'entry.2059299346',optionName:'entry.250639074',subject:'entry.1067028718',attendanceBucket:'entry.239647449',levelBucket:'entry.928460574',className:'entry.691390932',topic:'entry.1076597618',pdpTime:'entry.137993890',planningScore:'entry.276564800',implementationScore:'entry.431081358',reflectionScore:'entry.877415289',studentScore:'entry.1234919513'},
    note:'Mapping Google Form 2026 dikekalkan sebagai konfigurasi berasingan. Struktur instrumen dalam webapp berpandukan borang Guru dan Murid yang dibekalkan.'
  },
  sourceNote:'Sumber pengisian: ISPPK PdP (Guru) 2023 dan ISPPK PdP (Murid) 2023 yang dibekalkan pengguna; tahun operasi webapp kekal berversi.'
}
