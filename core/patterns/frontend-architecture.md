# Frontend Architecture Pattern

Preferred structure for small React/Tailwind landing projects:

```text
src/
├── components/
├── data/
├── sections/
├── App.jsx
├── index.css
└── main.jsx
```

## Principles

- App.jsx composes sections only.
- Repeated content lives in data modules.
- Sections own page-level layout.
- Components own reusable primitives.
- Tailwind utility classes remain close to the markup they style.
- Verification must pass before work is considered complete.
