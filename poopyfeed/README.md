# Poopyfeed

This project was generated using
[Angular CLI](https://github.com/angular/angular-cli) version 21.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to
`http://localhost:4200/`. The application will automatically reload
whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a
new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`,
`directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the
`dist/` directory. By default, the production build optimizes your
application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test
runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

E2E tests use **Playwright** and require the full stack to be running.

**From repo root (recommended):**

```bash
make run                  # Start frontend + backend
make test-e2e-install     # One-time: install Playwright + Firefox
make test-e2e-local       # Run E2E on host (Firefox)
```

**Or run E2E in a container (no host install):**

```bash
make run
make test-e2e             # Runs Playwright inside container
```

**From this directory:**

```bash
npm run test:e2e              # Firefox (default)
npm run test:e2e -- --project=chromium
npm run test:e2e:ui           # With Playwright UI
```

See **docs/E2E_SETUP.md** (in repo root) for full setup and troubleshooting.

## Additional Resources

For more information on using the Angular CLI, including detailed
command references, visit the [Angular CLI Overview and Command
Reference](https://angular.dev/tools/cli) page.
