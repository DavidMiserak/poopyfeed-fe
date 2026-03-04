# PoopyFeed Angular App

This `poopyfeed/` directory contains the Angular 21 application for the PoopyFeed baby care tracker.
For a full project overview, architecture, and container-based workflow, see the main `../README.md`.

## Quick start (local)

From this directory:

```bash
npm install
npm start        # Dev server at http://localhost:4200
```

## Testing

```bash
npm test         # Vitest unit/integration tests
npm run test:e2e # Playwright E2E (Firefox by default)
```

## Building

```bash
npm run build    # Production build to dist/poopyfeed/
```

## Angular CLI scaffolding

You can still use Angular CLI schematics for code generation:

```bash
ng generate component my-component
ng generate --help
```
