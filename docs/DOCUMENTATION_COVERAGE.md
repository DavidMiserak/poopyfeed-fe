# Documentation Coverage Report

Generated as part of standardizing JSDoc across the front-end (reference style, coverage priority). Excludes `*.spec.ts` and generated code.

## Summary

- **Models** (11 files): Documented (interfaces, fields, constants)
- **Services** (21 files): Documented (class + methods: @param, @returns, @throws)
- **Utils** (4 files): Documented (file + functions)
- **Guards** (2 files): Documented (purpose, @returns, @example)
- **Interceptors** (1 file): Documented (purpose, @param, @returns)
- **Project docs**: README, API.md, STYLE.md, CLAUDE.md — existing; README updated with Code Documentation section

## Models (`poopyfeed/src/app/models/`)

- **child.model.ts** – Child, ChildCreate, ChildUpdate, GENDER_LABELS, ROLE_LABELS
- **feeding.model.ts** – Feeding, FeedingCreate, FeedingUpdate, labels, FEEDING_VALIDATION
- **diaper.model.ts** – DiaperChange, DiaperChangeCreate, CHANGE_TYPE_LABELS, DIAPER_VALIDATION
- **nap.model.ts** – Nap, NapCreate, NAP_VALIDATION
- **pagination.model.ts** – PaginatedResponse&lt;T&gt;, PaginationMeta, DEFAULT_PAGE_SIZE (with @template and field docs)
- **sharing.model.ts** – ChildShare, ShareInvite, InviteCreate, InviteAccept, InviteAcceptResponse, SHARE\_\* (with @interface)
- **user.model.ts** – UserProfile, UserProfileUpdate, ChangePassword\*, DeleteAccountRequest (full JSDoc added)
- **analytics.model.ts** – All trend/summary/timeline/export/pattern interfaces (with @interface where missing)
- **notification.model.ts** – Notification, preferences, quiet hours, labels
- **catch-up.model.ts** – TimeWindow, CatchUpEvent, Batch*, TimeEstimation*, validation constants
- **index.ts** – Barrel export with file-level description

## Services (`poopyfeed/src/app/services/`)

All services have:

- File/class-level description (purpose, endpoints or behavior)
- Public methods: **@param**, **@returns**, **@throws** (where applicable)
- Signals/computed: brief description or readonly note

- **error.utils.ts** — ApiError class + ErrorHandler.handle (with @example), all helpers @param/@returns
- **auth.service.ts** — Auth interfaces + class; login, signup, logout, reset, getToken, updateToken, clearAuthAndRedirect
- **account.service.ts** — Profile, updateProfile, changePassword, deleteAccount
- **toast.service.ts** — Toast type/interface; success, error, warning, info, show, remove, clear
- **children.service.ts** — Already strong; list, get, create, update, delete + signals
- **datetime.service.ts** — userTimezone getter; getDate*, toUTC, toLocal, toInputFormat, fromInputFormat, format*
- **child-navigation.service.ts** — goToDashboard, goToAdvanced
- **last-child.service.ts** — getLastChildId, setLastChildId, clear
- **network-status.service.ts** — isOnline signal, class description
- **sw-cache.service.ts** — evictReadonlyListCaches(childId)
- **timezone-check.service.ts** — showBanner, dismiss, clearDismissal, updateToDetectedTimezone, finishUpdate
- **filter.service.ts** — FilterCriteria, TimestampedItem; filter() already had full JSDoc
- **tracking-list.service.ts** — TrackingListConfig&lt;T&gt;, signals, initialize, toggleSelection, etc.
- **feedings.service.ts** — Tracking service (existing JSDoc)
- **diapers.service.ts** — Tracking service (existing JSDoc)
- **naps.service.ts** — Tracking service (existing JSDoc)
- **batches.service.ts** — create(childId, events) with @example
- **sharing.service.ts** — listShares, revokeShare, listInvites, createInvite, toggleInvite, deleteInvite, acceptInvite, getInviteUrl
- **time-estimation.service.ts** — estimateEventTimes (already had @param/@returns/@example)
- **notification.service.ts** — list, listPage, getUnreadCount, plus other methods; signals described
- **analytics.service.ts** — Trend/summary/timeline/export/pattern methods (existing JSDoc)

## Utils (`poopyfeed/src/app/utils/`)

- **date.utils.ts** – File-level + all exported functions (parseDateOnly internal doc retained)
- **form-helpers.ts** – markAllAsTouched, resetFormCompletely, hasError, getErrorMessage (@param, @returns, @example)
- **form-base.ts** – TrackingFormBase and TrackingService interface (already documented)
- **bottle-feeding.utils.ts** – getRecommendedBottleAmount (already documented)

## Guards (`poopyfeed/src/app/guards/`)

- **auth.guard.ts** – authGuard: purpose, @returns, @example
- **public-only.guard.ts** – publicOnlyGuard: purpose, @returns, @example

## Interceptors (`poopyfeed/src/app/interceptors/`)

- **auth.interceptor.ts** – authInterceptor: adds Token header to /api/v1/; @param, @returns, @example

## Conventions Used

- **Reference style**: JSDoc with `@param`, `@returns`, `@throws` (when errors are thrown), `@example` in code blocks where useful.
- **Interfaces**: `@interface` and/or inline property comments; `@template T` on generics.
- **Services**: Class-level summary; every public method has at least @param and @returns.
- **Coverage**: All public APIs in models, services, utils, guards, interceptors; components and specs excluded.

## Maintenance

- When adding new public services, utils, or model types, add matching JSDoc (class/interface + methods/fields).
- Run `npm run lint` to catch syntax/type issues; JSDoc is not enforced by lint but should follow this report’s style.
