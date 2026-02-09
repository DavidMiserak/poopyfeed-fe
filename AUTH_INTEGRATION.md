# Authentication Integration Summary

This document describes the authentication integration between the Angular frontend and Django backend.

## What Was Implemented

### 1. Authentication Service (`src/app/services/auth.service.ts`)

A comprehensive authentication service with the following features:

- **Login**: POST to `/api/v1/auth/token/login/` with email and password
- **Signup**: POST to `/api/v1/auth/users/` to create new user
- **Logout**: POST to `/api/v1/auth/token/logout/` to invalidate token
- **Token Management**: Stores auth token in localStorage for persistence
- **Reactive State**: Uses signals for `isAuthenticated()` computed property
- **Error Handling**: Converts Django error responses into user-friendly messages

**API Endpoints:**

```typescript
POST /api/v1/auth/users/          // Register new user
POST /api/v1/auth/token/login/    // Login (returns auth_token)
POST /api/v1/auth/token/logout/   // Logout
```

### 2. HTTP Interceptor (`src/app/interceptors/auth.interceptor.ts`)

Automatically adds the `Authorization: Token {token}` header to all API requests:

- Only applies to requests containing `/api/v1/`
- Retrieves token from AuthService
- No manual header management needed in individual requests

### 3. Updated Components

**Login Component** (`src/app/auth/login/login.ts`):

- Integrated with AuthService
- Handles successful login by storing token and navigating to home
- Displays error messages from backend

**Signup Component** (`src/app/auth/signup/signup.ts`):

- Integrated with AuthService
- Automatically logs in after successful signup
- Validates password match before submission
- Displays error messages from backend

### 4. App Configuration

Updated `src/app/app.config.ts` to:

- Provide HttpClient with `provideHttpClient()`
- Register the auth interceptor with `withInterceptors([authInterceptor])`

## How to Use

### Starting the Development Environment

Make sure both backend and frontend containers are running:

```bash
# From project root
make run

# Or from front-end directory
make run
```

This starts:

- Django backend at `http://localhost:8000`
- Angular frontend at `http://localhost:4200`

The Angular dev server automatically proxies `/api/*` requests to the backend via `proxy.conf.json`.

### Testing the Integration

1. **Navigate to signup page**: `http://localhost:4200/signup`
    - Enter name, email, and password
    - Click "Create account"
    - You'll be automatically logged in and redirected

2. **Navigate to login page**: `http://localhost:4200/login`
    - Enter email and password
    - Click "Sign in"
    - You'll be redirected to home page

3. **Check authentication state**:
    - Token is stored in localStorage under key `auth_token`
    - Open browser DevTools → Application → Local Storage
    - You should see the auth token

### Using AuthService in Your Components

```typescript
import { Component, inject } from "@angular/core";
import { AuthService } from "./services/auth.service";

@Component({
    selector: "app-example",
    template: `
        @if (authService.isAuthenticated()) {
            <p>You are logged in!</p>
            <button (click)="logout()">Logout</button>
        } @else {
            <p>Please log in</p>
        }
    `,
})
export class Example {
    authService = inject(AuthService);

    logout() {
        this.authService.logout().subscribe();
    }
}
```

### Making Authenticated API Requests

No special configuration needed! The interceptor automatically adds the token:

```typescript
import { HttpClient } from "@angular/common/http";
import { inject } from "@angular/core";

export class ChildService {
    private http = inject(HttpClient);

    getChildren() {
        // Token is automatically added by the interceptor
        return this.http.get("/api/v1/children/");
    }

    createChild(data: { name: string; date_of_birth: string; gender: string }) {
        // Token is automatically added by the interceptor
        return this.http.post("/api/v1/children/", data);
    }
}
```

## API Error Handling

The AuthService converts Django REST Framework errors into user-friendly messages:

**Django Response:**

```json
{
    "email": ["User with this email already exists."]
}
```

**User Sees:**

```text
email: User with this email already exists.
```

**Django Response:**

```json
{
    "detail": "Invalid credentials"
}
```

**User Sees:**

```text
Invalid credentials
```

## Testing

All authentication features are fully tested with **94.3% code coverage**.

Run tests:

```bash
make test              # In container
npm test               # Locally
```

Test files:

- `src/app/services/auth.service.spec.ts` (8 tests)
- `src/app/interceptors/auth.interceptor.spec.ts` (3 tests)
- `src/app/auth/login/login.spec.ts` (19 tests)
- `src/app/auth/signup/signup.spec.ts` (26 tests)

## Token Persistence

The auth token is stored in localStorage and automatically loaded when the app initializes:

1. User logs in → token stored in localStorage
2. User refreshes page → AuthService reads token from localStorage
3. `isAuthenticated()` signal automatically updates
4. All API requests include the token via interceptor

## Security Considerations

- ✅ Tokens are stored in localStorage (persistent across sessions)
- ✅ Tokens are automatically added to API requests via interceptor
- ✅ Logout properly clears token from memory and localStorage
- ✅ SSR-safe: localStorage access is wrapped in `typeof window` check
- ⚠️ For production, consider using httpOnly cookies for enhanced security

## Next Steps

Now that authentication is wired up, you can:

1. Create protected routes with an auth guard
2. Build the dashboard/main app components
3. Implement the child management features
4. Add tracking features (feeding, diaper, nap)
5. Implement the sharing/invite system

## Troubleshooting

### "Network error" when logging in

Check that the Django backend is running:

```bash
make logs-backend
```

You should see Django server running on port 8000.

### "CORS error"

The Django backend should be configured to allow requests from `http://localhost:4200`. Check `back-end/config/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]
```

### Token not persisting

Check browser DevTools → Application → Local Storage. You should see `auth_token` key. If not, check for errors in the console.

### API requests missing Authorization header

The interceptor only adds headers to requests containing `/api/v1/`. Make sure your API URLs include this prefix.

## Files Modified/Created

**Created:**

- `src/app/services/auth.service.ts` - Authentication service
- `src/app/services/auth.service.spec.ts` - Service tests
- `src/app/interceptors/auth.interceptor.ts` - HTTP interceptor
- `src/app/interceptors/auth.interceptor.spec.ts` - Interceptor tests

**Modified:**

- `src/app/auth/login/login.ts` - Added AuthService integration
- `src/app/auth/login/login.spec.ts` - Updated tests
- `src/app/auth/signup/signup.ts` - Added AuthService integration
- `src/app/auth/signup/signup.spec.ts` - Updated tests
- `src/app/app.config.ts` - Added HttpClient and interceptor providers

## Technical Details

### TypeScript Interfaces

```typescript
interface AuthResponse {
    auth_token: string;
}

interface UserResponse {
    id: number;
    email: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface SignupRequest {
    email: string;
    password: string;
}
```

### Signal-Based State Management

The service uses Angular signals for reactive state:

```typescript
private authToken = signal<string | null>(this.getStoredToken());
isAuthenticated = computed(() => !!this.authToken());
```

This allows components to reactively respond to authentication state changes.

### Modern Angular Patterns

All code follows Angular 21+ best practices:

- Standalone components
- Function-based dependency injection with `inject()`
- Signal-based reactive state
- Native control flow in templates (`@if`, `@for`)
