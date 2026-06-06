# Vertical Taxonomy V1

Lead Machine uses this taxonomy to understand common Norwegian service searches before it asks Google Places or Brreg for candidates. The goal is practical beta reliability: normal searches such as `personlig trener i Kristiansand` and `hudpleie i Halden` should expand into related terms instead of failing as unknown free text.

## Scope

V1 focuses on common local categories that are easy for testers to type naturally:

- hands-on and vehicle services: rørlegger, elektriker, bilverksted
- health and appointment services: tannlege, fysioterapeut
- beauty and wellness: frisør, hudpleie, skjønnhetsklinikk, massasje
- fitness: personlig trener, treningssenter
- local services: kjøreskole, vaktmester, vindusvask, båtservice, fotograf

## Match Status

Candidates can be classified as:

- `exact`: clear category term in name/category.
- `synonym`: related term such as PT for personlig trener.
- `broad`: useful nearby category such as spa for hudpleie or gym for personlig trener.
- `weak`: possible but uncertain category, for example hair-only results for hudpleie.
- `unknown`: no usable vertical signal.

Weak and broad matches are seller-review signals. They are not treated as confirmed truth.

## Boundaries

This does not add 1881, Proff, SSB, scraping, CRM sync, email sending, or outreach automation. Provider data remains evidence, not truth.
