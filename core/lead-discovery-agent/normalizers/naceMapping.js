const INDUSTRY_NACE = {
  plumber: [{ code: '43.220', description: 'VVS-arbeid' }],
  electrician: [{ code: '43.210', description: 'Elektrisk installasjonsarbeid' }],
  lawyer: [{ code: '69.100', description: 'Juridisk tjenesteyting' }],
  accountant: [
    { code: '69.201', description: 'Regnskap og bokføring' },
    { code: '69.202', description: 'Revisjon' },
  ],
  dentist: [{ code: '86.230', description: 'Tannhelsetjenester' }],
  physiotherapist: [{ code: '86.901', description: 'Fysioterapitjeneste' }],
  restaurant: [{ code: '56.101', description: 'Drift av restauranter og kafeer' }],
  hairdresser: [{ code: '96.020', description: 'Frisering og annen skjønnhetspleie' }],
  car_repair: [{ code: '45.200', description: 'Vedlikehold og reparasjon av motorvogner' }],
  real_estate_agent: [{ code: '68.310', description: 'Eiendomsmegling' }],
}

const TERM_TO_INDUSTRY = [
  [/rørlegger|rorlegger|vvs|bad|varme/i, 'plumber'],
  [/elektriker|elektro/i, 'electrician'],
  [/advokat|juridisk/i, 'lawyer'],
  [/regnskap|regnskapsfører|revisor/i, 'accountant'],
  [/tannlege|tannklinikk/i, 'dentist'],
  [/fysioterapeut|fysio|kiropraktor/i, 'physiotherapist'],
  [/restaurant|kafe|cafe/i, 'restaurant'],
  [/frisør|frisor|hair/i, 'hairdresser'],
  [/bilverksted|verksted|bilservice/i, 'car_repair'],
  [/eiendomsmegler|megler/i, 'real_estate_agent'],
]

const MUNICIPALITY_CODES = {
  oslo: '0301', bergen: '4601', trondheim: '5001', stavanger: '1103', kristiansand: '4204', drammen: '3301', fredrikstad: '3107', sarpsborg: '3105', moss: '3103', halden: '3101',
  ålesund: '1508', alesund: '1508', molde: '1506', kristiansund: '1505', bodø: '1804', bodo: '1804', tromsø: '5501', tromso: '5501', alta: '5601', narvik: '1806', harstad: '5503',
  hamar: '3403', lillehammer: '3405', gjøvik: '3407', gjovik: '3407', elverum: '3420', kongsvinger: '3401', tønsberg: '3905', tonsberg: '3905', sandefjord: '3907', larvik: '3909',
  skien: '4003', porsgrunn: '4001', arendal: '4203', grimstad: '4202', mandal: '4205', flekkefjord: '4207', bryne: '1121', sandnes: '1108', haugesund: '1106', karmøy: '1149', karmoy: '1149',
  stord: '4614', voss: '4621', førde: '4647', forde: '4647', florø: '4602', floro: '4602', sogndal: '4640', gol: '3324', geilo: '3330', hønefoss: '3305', honefoss: '3305',
  kongsberg: '3303', notodden: '4005', ringerike: '3305', lillestrøm: '3205', lillestrom: '3205', jessheim: '3209', ski: '3207', asker: '3203', bærum: '3201', baerum: '3201',
  lørenskog: '3222', lorenskog: '3222', eidsvoll: '3240', ullensaker: '3209', nesodden: '3212', nittedal: '3232', råde: '3112', rade: '3112', rygge: '3103', rolvsøy: '3107', rolvsoy: '3107',
  namsos: '5007', steinkjer: '5006', levanger: '5037', stjørdal: '5035', stjordal: '5035', 'mo i rana': '1833', mosjøen: '1824', mosjoen: '1824', brønnøysund: '1813', bronnoysund: '1813',
  sortland: '1870', svolvær: '1865', svolvaer: '1865', hammerfest: '5603',
}

function findNaceForIndustry({ canonicalIndustry, industry, query } = {}) {
  const direct = normalizeIndustryKey(canonicalIndustry || industry)
  if (INDUSTRY_NACE[direct]) return INDUSTRY_NACE[direct]
  const haystack = [canonicalIndustry, industry, query].filter(Boolean).join(' ')
  for (const [pattern, key] of TERM_TO_INDUSTRY) {
    if (pattern.test(haystack)) return INDUSTRY_NACE[key] || []
  }
  return []
}

function municipalityCodeFor(location = '') {
  const key = normalizeLocationKey(location)
  return MUNICIPALITY_CODES[key] || null
}

function normalizeIndustryKey(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function normalizeLocationKey(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9æøå ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

module.exports = {
  INDUSTRY_NACE,
  MUNICIPALITY_CODES,
  findNaceForIndustry,
  municipalityCodeFor,
}
