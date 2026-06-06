const {
  normalizeVerticalTerm,
  expandQueryTerms,
  classifyVerticalCandidate,
  isExcludedCategory,
  demoVerticals,
  discoveryVerticalEntries,
} = require('../verticalTaxonomy')

function main() {
  assert(normalizeVerticalTerm('rørlegger') === 'plumber', 'rørlegger should map to plumber')
  assert(normalizeVerticalTerm('rørleggere') === 'plumber', 'rørleggere should map to plumber')
  assert(normalizeVerticalTerm('VVS') === 'plumber', 'VVS should map to plumber')
  assert(normalizeVerticalTerm('bilmekaniker') === 'auto_repair', 'bilmekaniker should map to auto_repair')
  assert(normalizeVerticalTerm('bilverksted') === 'auto_repair', 'bilverksted should map to auto_repair')
  assert(normalizeVerticalTerm('frisørsalong') === 'hair_salon', 'frisørsalong should map to hair_salon')
  assert(normalizeVerticalTerm('advokater') === 'lawyer', 'advokater should map to lawyer')
  assert(normalizeVerticalTerm('personlig trener') === 'personal_trainer', 'personlig trener should map to personal_trainer')
  assert(normalizeVerticalTerm('PT') === 'personal_trainer', 'PT should map to personal_trainer')
  assert(normalizeVerticalTerm('hudpleie') === 'skin_care', 'hudpleie should map to skin_care')
  assert(normalizeVerticalTerm('hudklinikk') === 'skin_care', 'hudklinikk should map to skin_care')

  const personalTrainerTerms = expandQueryTerms('personal_trainer')
  assert(personalTrainerTerms.includes('PT'), 'personal trainer expansion should include PT')
  assert(personalTrainerTerms.includes('personal trainer'), 'personal trainer expansion should include English term')
  assert(personalTrainerTerms.includes('treningssenter personlig trener'), 'personal trainer expansion should include broad Norwegian term')

  const skinCareTerms = expandQueryTerms('skin_care')
  assert(skinCareTerms.includes('hudklinikk'), 'skin care expansion should include hudklinikk')
  assert(skinCareTerms.includes('hudterapeut'), 'skin care expansion should include hudterapeut')
  assert(skinCareTerms.includes('skjønnhetsklinikk'), 'skin care expansion should include skjønnhetsklinikk')
  assert(skinCareTerms.includes('beauty salon'), 'skin care expansion should include beauty salon')
  assert(skinCareTerms.includes('spa'), 'skin care expansion should include spa')

  assert(classifyVerticalCandidate({ businessName: 'Halden Hudklinikk AS' }, { canonicalIndustry: 'skin care' }).status === 'exact', 'hudklinikk should be exact skin care')
  assert(classifyVerticalCandidate({ businessName: 'Halden Spa', providerTypes: ['spa'] }, { canonicalIndustry: 'skin care' }).status === 'broad', 'spa should be broad skin care')
  assert(classifyVerticalCandidate({ businessName: 'Halden Frisør', providerTypes: ['hair_care'] }, { canonicalIndustry: 'skin care' }).status === 'weak', 'hair-only should be weak for hudpleie')
  assert(classifyVerticalCandidate({ businessName: 'Fresh Fitness', providerTypes: ['gym'] }, { canonicalIndustry: 'personal trainer' }).status === 'broad', 'gym should be broad personal trainer')
  assert(classifyVerticalCandidate({ businessName: 'Hundetrener Halden' }, { canonicalIndustry: 'personal trainer' }).matches === false, 'hundetrener should be excluded for personal trainer')
  assert(isExcludedCategory('Tatovør Halden', 'skin care'), 'tattoo should be excluded for skin care')
  assert(demoVerticals().some((item) => item.canonical === 'personlig trener'), 'demo verticals should include personal trainer')
  assert(discoveryVerticalEntries().some((item) => item.canonical === 'skin care'), 'discovery entries should include skin care')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

main()
