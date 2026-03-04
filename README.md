# PoopyFeed - Angular Frontend

<p align="center">
  <img src="https://img.shields.io/badge/node-20+-green.svg" alt="Node 20+" />
  <img src="https://img.shields.io/badge/angular-21-red.svg" alt="Angular 21" />
  <img src="https://img.shields.io/badge/typescript-5.9+-blue.svg" alt="TypeScript 5.9+" />
  <img src="https://img.shields.io/badge/tailwind%20css-4.1-38B2AC.svg" alt="Tailwind CSS 4.1" />
  <a href="https://github.com/pre-commit/pre-commit">
    <img src="https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit" alt="pre-commit" />
  </a>
  <a href="https://www.conventionalcommits.org/">
    <img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits" alt="Conventional Commits" />
  </a>
  <a href="https://codecov.io/gh/DavidMiserak/poopyfeed-fe">
    <img src="https://codecov.io/gh/DavidMiserak/poopyfeed-fe/graph/badge.svg" alt="codecov" />
  </a>
</p>

A modern baby care tracking web application built with Angular 21, TypeScript, and Tailwind CSS. Track feedings, diaper changes, naps, and share access with co-parents and caregivers.
All Angular application source code lives under the `poopyfeed/` directory (see `poopyfeed/README.md` for app-level details).

## Features

- **Baby Profile Management** - Create and manage multiple child profiles with age display and gender icons
- **Activity Tracking** - Log feedings (bottle/breast), diaper changes (wet/dirty/both), and naps with full CRUD
- **Child Dashboard** - Today's summary counts, recent activity feed, and quick-log actions
- **Analytics & Charts** - Chart.js visualizations for feeding trends, diaper patterns, and sleep summaries
- **Data Export** - CSV (instant download) and PDF (async generation via Celery)
- **Role-Based Sharing** - Share access with co-parents (full access) or caregivers (view + add only) via invite links
- **Timeline View** - 7-day activity history with timezone-aware display
- **Push Notifications** - Feeding reminders and activity alerts with quiet hours support
- **Catch-Up Mode** - Bulk logging for catching up on missed entries
- **Pediatrician Summary** - "For the Doctor" view with daily averages for appointments
- **SSR Support** - Server-side rendering with Angular Universal + Express for fast initial loads
- **Modern Angular Architecture** - Built with Angular 21 standalone components and signals
- **Responsive Design** - Mobile-first, one-handed UI with Tailwind CSS v4

## Prerequisites

- **Node.js** 20+ and npm
- **Podman** or **Docker** (for containerized development)
- **Backend API** - Django backend from [poopyfeed-be](https://github.com/DavidMiserak/poopyfeed-be)

## Quick Start

### Container-Based Development (Recommended)

```bash
# Install dependencies
make install

# Start development server (http://localhost:4200)
make run

# In another terminal, view logs
make logs
```

### Local Development (Without Containers)

```bash
# Navigate to Angular app directory
cd poopyfeed

# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Run tests
npm test
```

## Development Commands

### Container Commands (Makefile)

```bash
make run              # Start Angular dev server in container (:4200)
make stop             # Stop containers
make test             # Run tests with Vitest in container
make test-local       # Run tests locally (npm test)
make build            # Build production app
make format           # Format code with Prettier
make install          # Install dependencies in container
make shell            # Execute shell in running container
make logs             # View container logs
make clean            # Clean build artifacts and cache
make pre-commit-setup # Install pre-commit hooks (required)
```

### Local Commands (npm)

```bash
npm start                      # Start dev server at :4200
npm test                       # Run Vitest tests with watch mode
npm run build                  # Production build to dist/poopyfeed/
npm run watch                  # Development build with watch mode
npm run serve:ssr:poopyfeed    # Run SSR Node server on :4000
```

## Project Structure

```text
/
├── poopyfeed/                    # Angular application root
│   ├── src/app/
│   │   ├── app.ts               # Root component
│   │   ├── app.routes.ts        # Route definitions (lazy loading)
│   │   ├── app.config.ts        # App configuration
│   │   ├── auth/                # Login and signup components
│   │   ├── children/            # Core feature modules
│   │   │   ├── list/            # Child list with navigation spinners
│   │   │   ├── form/            # Create/edit child profiles
│   │   │   ├── dashboard/       # Daily summary and activity feed
│   │   │   ├── feedings/        # Feeding tracking (bottle/breast)
│   │   │   ├── diapers/         # Diaper change tracking
│   │   │   ├── naps/            # Nap tracking
│   │   │   ├── sharing/         # Share management and invites
│   │   │   ├── timeline/        # 7-day activity history
│   │   │   └── pediatrician-summary/  # "For the Doctor" view
│   │   ├── features/
│   │   │   ├── analytics/       # Chart.js dashboards and export
│   │   │   └── catch-up/        # Bulk logging
│   │   ├── models/              # TypeScript interfaces for API resources
│   │   ├── services/            # API services with signal-based state
│   │   ├── utils/               # Shared utilities (dates, forms, etc.)
│   │   ├── components/          # Shared UI components (header, footer, toast)
│   │   ├── guards/              # Auth and public-only route guards
│   │   └── interceptors/        # HTTP auth interceptor
│   ├── e2e/                     # Playwright E2E tests
│   ├── angular.json             # Build configuration
│   └── tsconfig.json            # TypeScript base config (strict mode)
├── Containerfile                # Multi-stage Docker build
├── podman-compose.yaml          # Local development environment
├── Makefile                     # Development commands
└── docs/
    ├── API.md                   # Backend API documentation
    └── STYLE.md                 # Frontend styling guide
```

## Technology Stack

### Core Framework

- **Angular** 21.1.3 - Modern web framework with standalone components
- **TypeScript** 5.9.2 - Strict mode enabled
- **RxJS** 7.8.0 - Reactive programming

### Styling

- **Tailwind CSS** 4.1.18 - Utility-first CSS framework
- **PostCSS** 8.5.6 - CSS processing

### Server-Side Rendering

- **Angular Universal** - SSR support
- **Express** 5.1.0+ - Node.js server for SSR

### Testing

- **Vitest** 4.0.8 - Fast unit test framework (83 spec files)
- **Playwright** - E2E browser testing (10 spec files, Firefox + Chromium)
- **JSDOM** 27.1.0 - DOM implementation for unit tests

### Visualization

- **Chart.js** - Analytics charts (feeding trends, diaper patterns, sleep)
- **dayjs** - Timezone-aware date formatting

### Development Tools

- **Pre-commit hooks** - Code quality and commit message validation
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Codespell** - Spell checking

## Architecture

### Modern Angular Patterns

This project uses Angular 21+ modern patterns:

- **Standalone Components** - No NgModules, all components standalone
- **Signal-Based State** - `signal()`, `computed()`, and `effect()` for reactivity
- **Modern APIs** - `input()` and `output()` functions instead of decorators
- **Native Control Flow** - Template syntax with `@if`, `@for`, `@switch`
- **Function-Based DI** - `inject()` instead of constructor injection

Example component:

```typescript
import { Component, input, output, computed, signal } from "@angular/core";

@Component({
    selector: "app-example",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (isLoading()) {
            <p>Loading...</p>
        } @else {
            <p>{{ displayName() }}</p>
        }
    `,
})
export class Example {
    name = input.required<string>();
    clicked = output<void>();
    isLoading = signal(false);
    displayName = computed(() => `Hello, ${this.name()}!`);
}
```

### Backend API Integration

The frontend connects to a Django REST API at `/api/v1/`. See `docs/API.md` for full documentation.

**Base URL**: `http://localhost:8000/api/v1/`

**Authentication**: Token-based auth via Djoser

- POST `/auth/token/login/` returns `auth_token`
- Include in headers: `Authorization: Token {token}`

**Main Resources** (all require authentication):

- `/children/` - Child profiles (CRUD)
- `/children/{child_pk}/feedings/` - Feeding tracking
- `/children/{child_pk}/diapers/` - Diaper changes
- `/children/{child_pk}/naps/` - Nap tracking
- `/children/{id}/shares/` - Sharing management
- `/children/{id}/invites/` - Invite links

**Permission Roles**:

- **Owner** - Full access (child creator)
- **Co-parent** (`CO`) - View, add, edit, delete tracking records
- **Caregiver** (`CG`) - View and add tracking records only

## Testing

### Unit Tests (Vitest)

```bash
# Container-based
make test

# Local (watch mode)
cd poopyfeed && npm test

# Run specific file
cd poopyfeed && npx vitest run src/app/services/children.service.spec.ts

# Coverage report
make test-coverage
```

Test files are colocated with source files (`*.spec.ts`). Uses Angular TestBed with Vitest.

### E2E Tests (Playwright)

```bash
# Requires full stack running (make run from root repo)
cd poopyfeed && npm run test:e2e                       # Firefox (default)
cd poopyfeed && npm run test:e2e -- --project=chromium  # Chromium
cd poopyfeed && npm run test:e2e:ui                     # With UI inspector
```

E2E tests cover auth flows, child management, tracking CRUD, analytics, sharing, and notifications.

## Build & Deployment

### Production Build

```bash
# Local build
npm run build

# Container build
make build

# Build production Docker image
make image-build-prod
```

**Build outputs**:

- `dist/poopyfeed/browser/` - Client-side bundle (for nginx)
- `dist/poopyfeed/server/server.mjs` - SSR Node.js server

**Build budgets**:

- Initial bundle: 500 KB warning, 1 MB error
- Component styles: 4 KB warning, 8 KB error

### SSR Deployment

Run SSR server:

```bash
npm run serve:ssr:poopyfeed  # Runs on :4000
```

Production deployment uses multi-stage Containerfile:

- Build stage compiles Angular app
- Production stage serves via nginx
- Development stage runs dev server

## Git Workflow

### Pre-commit Hooks

**Setup** (required before first commit):

```bash
make pre-commit-setup
```

**Checks run on commit**:

- Conventional commit message format
- Trailing whitespace and large file checks
- Spell checking with Codespell
- Markdown linting
- Prettier formatting

### Commit Message Format

Use conventional commits:

```bash
feat: add feeding tracking component
fix: resolve timezone conversion bug
docs: update API integration guide
chore: upgrade Angular to 21.1.3
```

## Accessibility

All components must meet accessibility standards:

- **AXE compliance** - Pass automated AXE checks
- **WCAG 2.1 Level AA** - Follow Web Content Accessibility Guidelines
- Semantic HTML and proper ARIA attributes
- Keyboard navigation support
- Sufficient color contrast

## Development Guidelines

Key principles:

- Use modern Angular APIs (`input()`, `output()`, `inject()`)
- Prefer signals over imperative state management
- Follow TypeScript strict mode (no `any` types)
- Write accessible, semantic HTML
- Use Tailwind utilities for styling
- Test with Vitest and TestBed

## Project Status

**Current Phase**: Full-featured application with comprehensive test coverage

- Children management with profiles, dashboard, and activity tracking
- Full CRUD for feedings, diapers, and naps with form validation
- Analytics dashboard with Chart.js visualizations
- Data export (CSV instant download, PDF async generation)
- Push notifications with quiet hours and feeding reminders
- Sharing and invite system with role-based access
- Timeline/activity history with timezone-aware display
- Catch-up mode for bulk logging
- Pediatrician summary with daily averages
- Contact page with FormSpree integration
- 83 test spec files with ~89% coverage
- 10 Playwright E2E test suites

## Related Documentation

- **Backend API**: [poopyfeed-be](https://github.com/DavidMiserak/poopyfeed-be) - Django backend setup and API
- **API Reference**: `docs/API.md` - Comprehensive API documentation
- **Style Guide**: `docs/STYLE.md` - Frontend styling guide and design tokens
