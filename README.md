# PoopyFeed - Angular Frontend

A modern baby care tracking web application built with Angular 21, TypeScript, and Tailwind CSS. Track feedings, diaper changes, naps, and share access with co-parents and caregivers.

## Features

- **Baby Profile Management** - Create and manage multiple child profiles
- **Activity Tracking** - Log feedings (bottle/breast), diaper changes, and naps
- **Role-Based Sharing** - Share access with co-parents (full access) or caregivers (view + add only)
- **Real-Time Updates** - Server-side rendering (SSR) support for fast initial loads
- **Modern Angular Architecture** - Built with Angular 21 standalone components and signals
- **Responsive Design** - Mobile-first UI with Tailwind CSS v4

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
│   ├── src/
│   │   ├── app/                 # Root component (standalone)
│   │   │   ├── app.ts           # Root component
│   │   │   ├── app.routes.ts    # Route definitions
│   │   │   ├── app.config.ts    # App configuration
│   │   │   └── app.config.server.ts  # SSR configuration
│   │   ├── main.ts              # Client-side bootstrap
│   │   ├── main.server.ts       # Server-side bootstrap
│   │   ├── server.ts            # Express server for SSR
│   │   └── styles.css           # Global styles (Tailwind)
│   ├── angular.json             # Build configuration
│   ├── tsconfig.json            # TypeScript base config (strict mode)
│   └── .claude/CLAUDE.md        # Detailed coding guidelines
├── Containerfile                # Multi-stage Docker build
├── podman-compose.yaml          # Local development environment
├── Makefile                     # Development commands
├── CLAUDE.md                    # Project documentation for Claude Code
└── docs/
    └── API.md                   # Backend API documentation (773 lines)
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

### Testing Framework

- **Vitest** 4.0.8 - Fast unit test framework
- **JSDOM** 27.1.0 - DOM implementation for testing

### Development Tools

- **Pre-commit hooks** - Code quality and commit message validation
- **Prettier** - Code formatting
- **Markdownlint** - Markdown linting
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

Run tests with Vitest:

```bash
# Container-based
make test

# Local
npm test
```

Test files are colocated with source files (`*.spec.ts`). Uses Angular TestBed with Vitest.

Example test:

```typescript
describe("Component", () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Component],
        }).compileComponents();
    });

    it("should work", () => {
        const fixture = TestBed.createComponent(Component);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
```

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

See `CLAUDE.md` and `poopyfeed/.claude/CLAUDE.md` for comprehensive coding guidelines.

Key principles:

- Use modern Angular APIs (`input()`, `output()`, `inject()`)
- Prefer signals over imperative state management
- Follow TypeScript strict mode (no `any` types)
- Write accessible, semantic HTML
- Use Tailwind utilities for styling
- Test with Vitest and TestBed

## Project Status

**Current Phase**: Initial setup complete, ready for feature development

✅ **Completed**:

- Angular 21 standalone component architecture
- SSR with Express server configuration
- Containerized development and production builds
- Backend API documentation (773 lines)
- Pre-commit hooks and code quality tools
- Tailwind CSS v4 integration
- Vitest testing framework

🚧 **Next Steps**:

- Feature routes and navigation
- API integration services
- Authentication service with token management
- TypeScript models/interfaces for API resources
- Child management components
- Tracking components (feeding, diaper, nap)
- Sharing/invite management UI
- State management with signals
- Unit tests for components/services

## Related Documentation

- **Backend API**: [poopyfeed-be](https://github.com/DavidMiserak/poopyfeed-be) - Django backend setup and API
- **API Reference**: `docs/API.md` - Comprehensive API documentation
- **Coding Guidelines**: `CLAUDE.md` - Project-wide coding standards
- **Angular Guidelines**: `poopyfeed/.claude/CLAUDE.md` - Angular-specific patterns

## License

<!-- Add license information -->
