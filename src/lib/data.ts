import type { Evaluator, SchoolClass, SchoolSettings, Subject, Teacher } from './types'

export const SCHOOL: SchoolSettings = {
  schoolCode: 'JBA5095',
  schoolName: 'SEKOLAH KEBANGSAAN SUNGAI ABONG',
  address: '',
  phone: '',
  fax: '',
  officialEmail: '',
  grade: '',
  schoolType: '',
  location: '',
  ppd: 'MUAR',
  state: 'JOHOR',
  schoolProgram: ''
}

export const DEFAULT_EVALUATORS: Evaluator[] = [
  { id:'evaluator-01', name:'SITI ZALEHA BTE RAMLAN', position:'PENGETUA/GURU BESAR', active:true, sortOrder:1 },
  { id:'evaluator-02', name:'NADZLIN HAFIZA BINTI MOHD YASIN', position:'PENOLONG KANAN', active:true, sortOrder:2 },
  { id:'evaluator-03', name:'ABD AZIZ BIN ABDUL RAHMAN', position:'PENOLONG PPD', active:true, sortOrder:3 },
  { id:'evaluator-04', name:'DALMAN BIN DASIRON', position:'PENOLONG KANAN HEM', active:true, sortOrder:4 },
  { id:'evaluator-05', name:'HUZIL BIN TALIB', position:'PENOLONG PPD', active:true, sortOrder:5 },
  { id:'evaluator-06', name:'ZURIANA BINTI KAMARUDIN', position:'PENOLONG KANAN KOKURIKULUM', active:true, sortOrder:6 },
  { id:'evaluator-07', name:'MARDIANA BT SAMSURY', position:'GURU AKADEMIK BIASA/GURU PENOLONG', active:true, sortOrder:7 },
  { id:'evaluator-08', name:'MUZLEHA BINTI MD MUKEAR @ MD MUKIAR', position:'GURU AKADEMIK BIASA/GURU PENOLONG', active:true, sortOrder:8 },
  { id:'evaluator-09', name:'NORLIZA BTE TAIB', position:'GURU AKADEMIK BIASA/GURU PENOLONG', active:true, sortOrder:9 },
  { id:'evaluator-10', name:'ERDALINA BINTI RAMLI', position:'GURU PENDIDIKAN ISLAM SEKOLAH RENDAH', active:true, sortOrder:10 }
]

const rawTeachers: Array<[string, 'Lelaki' | 'Perempuan', number]> = [
  ['SITI ZALEHA BINTI RAMLAN', 'Perempuan', 1],
  ['NADZLIN HAFIZA BINTI MOHD YASIN', 'Perempuan', 2],
  ['DALMAN BIN DASIRON', 'Lelaki', 3],
  ['ZURIANA BINTI KAMARUDIN', 'Perempuan', 4],
  ['AHMAD AFFENDY BIN MOHAMED TAHIR', 'Lelaki', 5],
  ['AZIZAH BTE WAHID', 'Perempuan', 6],
  ['ERDALINA BT RAMLI', 'Perempuan', 7],
  ['NAJIHA BINTI ABD KADIR', 'Perempuan', 8],
  ['SITI SARIYANA BINTI MOHD.SAPIAN', 'Perempuan', 9],
  ['SUJATHA A/P RAJAMANIKAM', 'Perempuan', 10],
  ['AHMAD BADRUL BIN JUSOH', 'Lelaki', 11],
  ['AHMAD NAIMUDDIN BIN A MANAF', 'Lelaki', 12],
  ['FADHLUN BT MOHAMAD', 'Perempuan', 13],
  ['HASLIZA BT MOHD.SHAH', 'Perempuan', 14],
  ['KHAIRUL NIZWAN BIN HAMALI', 'Lelaki', 15],
  ['MARDIANA BT SAMSURY', 'Perempuan', 16],
  ['MARIYANA BT DIN', 'Perempuan', 17],
  ['MASITAH BINTI IBRAHIM', 'Perempuan', 18],
  ['MOHD HASRUL ASRAF BIN OTHMAN', 'Lelaki', 19],
  ['MUHD.SHUKRI BIN SHAMSUDDIN', 'Lelaki', 20],
  ['MOHD.SUKHAIRI BIN OSMAN', 'Lelaki', 21],
  ['MUHAMMAD RAIS BIN TAIB@SIDEK', 'Lelaki', 22],
  ['MUZLEHA BT.MD.MUKIER@MD.MUKIAR', 'Perempuan', 23],
  ['NOOR AFIQ BIN NOOR OTHMAN', 'Lelaki', 24],
  ['NOOR HIDAYAH BT JAMAL', 'Perempuan', 25],
  ['NOORZAIMAH BT NOORDIN', 'Perempuan', 26],
  ['NORDIN BIN ABDUL WAHAB', 'Lelaki', 27],
  ['NORLIZA BT TAIB', 'Perempuan', 28],
  ['RODIZAH BT HASHIM', 'Perempuan', 29],
  // No. 30 removed - moved school.
  ['SAKNIAH BINTI MD.DALI', 'Perempuan', 31],
  ['SHOKRI BIN SENIN', 'Lelaki', 32],
  ['SITI HAJAR BINTI SUBARI', 'Perempuan', 33],
  ['SITI KHALIJAH BT AB.AZIZ', 'Perempuan', 34],
  ['SITI ZAHARAH BT MANAP', 'Perempuan', 35],
  ['ZAINATUL FIRDAOS BINTI MUKAYAT', 'Perempuan', 36],
  ['ADINDA DEWI AWRA BINTI BAHAROLISHAM', 'Perempuan', 37],
  ['HAZIQAH BINTI NASIR', 'Perempuan', 38],
  ['NOR FARAHIN BINTI MOHD HALIL', 'Perempuan', 39],
  ['IZZAH NAZIRAH BINTI MOHD NAJIB', 'Perempuan', 40],
  ['NURUL IZZATI BINTI ABU JAIS', 'Perempuan', 41],
  // No. 42 removed - retired.
  ['WAN NORASHAM BIN AHMAD MOKSINON', 'Lelaki', 43],
  ['RAHIMAH BT KAMILAN', 'Perempuan', 44],
  ['KAMAL ISHAK BIN ALI', 'Lelaki', 45],
  ['MOHD.ASRI BIN ABDUL HALIM@ABDULALIM', 'Lelaki', 46],
  ['SYUHADA BINTI MD SARIP', 'Perempuan', 47]
]

export const DEFAULT_TEACHERS: Teacher[] = rawTeachers.map(([name, gender, sortOrder], i) => ({
  id: `teacher-${String(i + 1).padStart(2, '0')}`,
  name,
  gender,
  optionName: '',
  active: true,
  sortOrder
}))

export const DEFAULT_CLASSES: SchoolClass[] = [1, 2, 3, 4, 5, 6].flatMap((year) =>
  ['IBNU SINA', 'IBNU KHALDUN', 'IBNU BATTUTAH'].map((name, index) => ({
    id: `class-${year}-${index + 1}`,
    year,
    name,
    active: true
  }))
)

export const DEFAULT_SUBJECTS: Subject[] = [
  'BAHASA MELAYU',
  'BAHASA INGGERIS',
  'MATEMATIK',
  'SAINS',
  'PENDIDIKAN ISLAM',
  'PENDIDIKAN MORAL',
  'SEJARAH',
  'PENDIDIKAN JASMANI DAN PENDIDIKAN KESIHATAN',
  'PENDIDIKAN SENI VISUAL',
  'PENDIDIKAN MUZIK',
  'REKA BENTUK DAN TEKNOLOGI',
  'BAHASA ARAB'
].map((name, i) => ({ id: `subject-${i + 1}`, name, active: true }))
