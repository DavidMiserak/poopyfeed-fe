# PoopyFeed Backend API Documentation

This document describes the REST API provided by the PoopyFeed backend
(`../back-end`).

## Base URL

All API endpoints are prefixed with `/api/v1/`.

Example: `http://localhost:8000/api/v1/children/`

## Authentication

The API uses **Token Authentication** via Djoser.

### Authentication Endpoints

All authentication endpoints are under `/api/v1/auth/`:

| Endpoint                     | Method | Description                 |
| ---------------------------- | ------ | --------------------------- |
| `/api/v1/auth/users/`        | POST   | Register a new user         |
| `/api/v1/auth/token/login/`  | POST   | Login and get auth token    |
| `/api/v1/auth/token/logout/` | POST   | Logout and invalidate token |

#### Register User

```http
POST /api/v1/auth/users/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
    "id": 1,
    "email": "user@example.com"
}
```

#### Login

```http
POST /api/v1/auth/token/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
    "auth_token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

#### Authenticated Requests

Include the token in the `Authorization` header for all authenticated requests:

```http
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

## Resources

### Children

Children are the primary resource representing babies/infants being tracked.

#### List Children

Get all children the authenticated user has access to (owned or shared).

```http
GET /api/v1/children/
Authorization: Token {token}
```

**Response:**

```json
[
    {
        "id": 1,
        "name": "Baby Jane",
        "date_of_birth": "2025-06-15",
        "gender": "F",
        "created_at": "2025-12-01T10:00:00Z",
        "updated_at": "2025-12-01T10:00:00Z",
        "user_role": "owner",
        "can_edit": true,
        "can_manage_sharing": true
    }
]
```

#### Get Child Details

```http
GET /api/v1/children/{id}/
Authorization: Token {token}
```

#### Create Child

```http
POST /api/v1/children/
Authorization: Token {token}
Content-Type: application/json

{
  "name": "Baby John",
  "date_of_birth": "2025-08-20",
  "gender": "M"
}
```

**Fields:**

- `name` (string, required): Child's name
- `date_of_birth` (date, required): Format `YYYY-MM-DD`
- `gender` (string, optional): `"M"` (Male), `"F"` (Female), or `"O"` (Other)

**Response:**

```json
{
    "id": 2,
    "name": "Baby John",
    "date_of_birth": "2025-08-20",
    "gender": "M",
    "created_at": "2026-02-08T12:00:00Z",
    "updated_at": "2026-02-08T12:00:00Z",
    "user_role": "owner",
    "can_edit": true,
    "can_manage_sharing": true
}
```

#### Update Child

```http
PUT /api/v1/children/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "name": "Baby Jonathan",
  "date_of_birth": "2025-08-20",
  "gender": "M"
}
```

or

```http
PATCH /api/v1/children/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "name": "Baby Jonathan"
}
```

**Permissions:** Owner or Co-parent role required.

#### Delete Child

```http
DELETE /api/v1/children/{id}/
Authorization: Token {token}
```

**Permissions:** Owner only.

### Feedings

Track feeding events (bottle or breast).

#### List Feedings

```http
GET /api/v1/children/{child_pk}/feedings/
Authorization: Token {token}
```

**Response:**

```json
[
    {
        "id": 1,
        "feeding_type": "bottle",
        "feeding_type_display": "Bottle",
        "fed_at": "2026-02-08T08:30:00Z",
        "amount_oz": "4.5",
        "duration_minutes": null,
        "side": "",
        "side_display": "",
        "created_at": "2026-02-08T08:35:00Z",
        "updated_at": "2026-02-08T08:35:00Z"
    },
    {
        "id": 2,
        "feeding_type": "breast",
        "feeding_type_display": "Breast",
        "fed_at": "2026-02-08T11:15:00Z",
        "amount_oz": null,
        "duration_minutes": 15,
        "side": "left",
        "side_display": "Left",
        "created_at": "2026-02-08T11:30:00Z",
        "updated_at": "2026-02-08T11:30:00Z"
    }
]
```

#### Get Feeding Details

```http
GET /api/v1/children/{child_pk}/feedings/{id}/
Authorization: Token {token}
```

#### Create Feeding

**Bottle Feeding:**

```http
POST /api/v1/children/{child_pk}/feedings/
Authorization: Token {token}
Content-Type: application/json

{
  "feeding_type": "bottle",
  "fed_at": "2026-02-08T14:00:00Z",
  "amount_oz": "5.0"
}
```

**Breast Feeding:**

```http
POST /api/v1/children/{child_pk}/feedings/
Authorization: Token {token}
Content-Type: application/json

{
  "feeding_type": "breast",
  "fed_at": "2026-02-08T14:00:00Z",
  "duration_minutes": 20,
  "side": "right"
}
```

**Fields:**

- `feeding_type` (string, required): `"bottle"` or `"breast"`
- `fed_at` (datetime, required): ISO 8601 format
- **For bottle:**
    - `amount_oz` (decimal, required): 0.1 - 50.0 oz
- **For breast:**
    - `duration_minutes` (integer, required): 1 - 180 minutes
    - `side` (string, required): `"left"`, `"right"`, or `"both"`

**Validation:**

- Bottle feedings require `amount_oz` (clears duration/side)
- Breast feedings require `duration_minutes` and `side` (clears amount_oz)

#### Update Feeding

```http
PUT /api/v1/children/{child_pk}/feedings/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "feeding_type": "bottle",
  "fed_at": "2026-02-08T14:00:00Z",
  "amount_oz": "6.0"
}
```

or

```http
PATCH /api/v1/children/{child_pk}/feedings/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "amount_oz": "6.0"
}
```

**Permissions:** Owner or Co-parent role required.

#### Delete Feeding

```http
DELETE /api/v1/children/{child_pk}/feedings/{id}/
Authorization: Token {token}
```

**Permissions:** Owner or Co-parent role required.

### Diapers

Track diaper change events.

#### List Diaper Changes

```http
GET /api/v1/children/{child_pk}/diapers/
Authorization: Token {token}
```

**Response:**

```json
[
    {
        "id": 1,
        "change_type": "wet",
        "change_type_display": "Wet",
        "changed_at": "2026-02-08T09:00:00Z",
        "created_at": "2026-02-08T09:05:00Z",
        "updated_at": "2026-02-08T09:05:00Z"
    },
    {
        "id": 2,
        "change_type": "both",
        "change_type_display": "Wet + Dirty",
        "changed_at": "2026-02-08T12:30:00Z",
        "created_at": "2026-02-08T12:35:00Z",
        "updated_at": "2026-02-08T12:35:00Z"
    }
]
```

#### Get Diaper Change Details

```http
GET /api/v1/children/{child_pk}/diapers/{id}/
Authorization: Token {token}
```

#### Create Diaper Change

```http
POST /api/v1/children/{child_pk}/diapers/
Authorization: Token {token}
Content-Type: application/json

{
  "change_type": "dirty",
  "changed_at": "2026-02-08T15:00:00Z"
}
```

**Fields:**

- `change_type` (string, required): `"wet"`, `"dirty"`, or `"both"`
- `changed_at` (datetime, required): ISO 8601 format

#### Update Diaper Change

```http
PUT /api/v1/children/{child_pk}/diapers/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "change_type": "both",
  "changed_at": "2026-02-08T15:00:00Z"
}
```

or

```http
PATCH /api/v1/children/{child_pk}/diapers/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "change_type": "both"
}
```

**Permissions:** Owner or Co-parent role required.

#### Delete Diaper Change

```http
DELETE /api/v1/children/{child_pk}/diapers/{id}/
Authorization: Token {token}
```

**Permissions:** Owner or Co-parent role required.

### Naps

Track nap/sleep events.

#### List Naps

```http
GET /api/v1/children/{child_pk}/naps/
Authorization: Token {token}
```

**Response:**

```json
[
    {
        "id": 1,
        "napped_at": "2026-02-08T10:00:00Z",
        "created_at": "2026-02-08T10:05:00Z",
        "updated_at": "2026-02-08T10:05:00Z"
    }
]
```

#### Get Nap Details

```http
GET /api/v1/children/{child_pk}/naps/{id}/
Authorization: Token {token}
```

#### Create Nap

```http
POST /api/v1/children/{child_pk}/naps/
Authorization: Token {token}
Content-Type: application/json

{
  "napped_at": "2026-02-08T13:00:00Z"
}
```

**Fields:**

- `napped_at` (datetime, required): ISO 8601 format

#### Update Nap

```http
PUT /api/v1/children/{child_pk}/naps/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "napped_at": "2026-02-08T13:30:00Z"
}
```

or

```http
PATCH /api/v1/children/{child_pk}/naps/{id}/
Authorization: Token {token}
Content-Type: application/json

{
  "napped_at": "2026-02-08T13:30:00Z"
}
```

**Permissions:** Owner or Co-parent role required.

#### Delete Nap

```http
DELETE /api/v1/children/{child_pk}/naps/{id}/
Authorization: Token {token}
```

**Permissions:** Owner or Co-parent role required.

## Sharing System

### Child Sharing Endpoints

#### List Shares for a Child

Get all users who have access to a child (owner only).

```http
GET /api/v1/children/{id}/shares/
Authorization: Token {token}
```

**Response:**

```json
[
    {
        "id": 1,
        "user_email": "partner@example.com",
        "role": "CO",
        "role_display": "Co-parent",
        "created_at": "2026-02-01T10:00:00Z"
    },
    {
        "id": 2,
        "user_email": "caregiver@example.com",
        "role": "CG",
        "role_display": "Caregiver",
        "created_at": "2026-02-05T12:00:00Z"
    }
]
```

**Permissions:** Owner only.

#### Revoke Access

Remove a user's access to a child (owner only).

```http
DELETE /api/v1/children/{id}/shares/{share_pk}/
Authorization: Token {token}
```

**Permissions:** Owner only.

### Invite Management

#### List Invites

Get all invite links for a child (owner only).

```http
GET /api/v1/children/{id}/invites/
Authorization: Token {token}
```

**Response:**

```json
[
    {
        "id": 1,
        "token": "abc123xyz789...",
        "role": "CO",
        "role_display": "Co-parent",
        "is_active": true,
        "created_at": "2026-02-01T10:00:00Z",
        "invite_url": "http://localhost:8000/children/accept-invite/abc123xyz789.../"
    }
]
```

**Permissions:** Owner only.

#### Create Invite

Create a new invite link (owner only).

```http
POST /api/v1/children/{id}/invites/
Authorization: Token {token}
Content-Type: application/json

{
  "role": "CG"
}
```

**Fields:**

- `role` (string, required): `"CO"` (Co-parent) or `"CG"` (Caregiver)

**Response:**

```json
{
    "id": 2,
    "token": "def456uvw012...",
    "role": "CG",
    "role_display": "Caregiver",
    "is_active": true,
    "created_at": "2026-02-08T15:00:00Z",
    "invite_url": "http://localhost:8000/children/accept-invite/def456uvw012.../"
}
```

**Permissions:** Owner only.

#### Toggle Invite Active Status

Activate or deactivate an invite link (owner only).

```http
PATCH /api/v1/children/{id}/invites/{invite_pk}/
Authorization: Token {token}
```

**Response:**

```json
{
    "id": 2,
    "token": "def456uvw012...",
    "role": "CG",
    "role_display": "Caregiver",
    "is_active": false,
    "created_at": "2026-02-08T15:00:00Z",
    "invite_url": "http://localhost:8000/children/accept-invite/def456uvw012.../"
}
```

**Permissions:** Owner only.

#### Delete Invite

Permanently delete an invite link (owner only).

```http
DELETE /api/v1/children/{id}/invites/{invite_pk}/delete/
Authorization: Token {token}
```

**Permissions:** Owner only.

### Accept Invite

Accept an invite to gain access to a child.

```http
POST /api/v1/invites/accept/
Authorization: Token {token}
Content-Type: application/json

{
  "token": "abc123xyz789..."
}
```

**Response:**

Returns the child data (same as GET /api/v1/children/{id}/):

```json
{
    "id": 1,
    "name": "Baby Jane",
    "date_of_birth": "2025-06-15",
    "gender": "F",
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-01T10:00:00Z",
    "user_role": "cg",
    "can_edit": false,
    "can_manage_sharing": false
}
```

**Status Codes:**

- `201 Created`: New share created successfully
- `200 OK`: User already had access (existing share)
- `400 Bad Request`: Invalid or inactive token, or user is already owner

## Permission Roles

The API uses role-based permissions:

| Role                 | Description                | Permissions                                          |
| -------------------- | -------------------------- | ---------------------------------------------------- |
| **Owner**            | Child's parent (creator)   | Full access: view, add, edit, delete, manage sharing |
| **Co-parent** (`CO`) | Shared with co-parent role | View, add, edit, delete tracking records             |
| **Caregiver** (`CG`) | Shared with caregiver role | View and add tracking records only                   |

**Permission Summary:**

- **View/List Children & Tracking:** Any role (owner, co-parent, caregiver)
- **Create Tracking Records:** Any role (owner, co-parent, caregiver)
- **Update Tracking Records:** Owner or co-parent only
- **Delete Tracking Records:** Owner or co-parent only
- **Update Child:** Owner or co-parent only
- **Delete Child:** Owner only
- **Manage Sharing (shares/invites):** Owner only

## Error Responses

The API returns standard HTTP status codes:

**4xx Client Errors:**

```json
{
    "detail": "Authentication credentials were not provided."
}
```

or

```json
{
    "field_name": ["This field is required."]
}
```

**Common Status Codes:**

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found

## CORS Configuration

If accessing the API from the Angular frontend at a different origin,
ensure CORS is properly configured in the Django backend settings.

## Additional Notes

### Nested vs Top-Level Routes

Tracking resources (feedings, diapers, naps) are nested under children:

- **Nested:** `/api/v1/children/{child_pk}/feedings/` (preferred for frontend)
- The nested routes automatically scope to the specified child

### Datetime Handling

- All datetime fields (`fed_at`, `changed_at`, `napped_at`) use ISO 8601 format
- The backend stores times in UTC
- Frontend should convert local times to UTC before sending to API
- Backend responses include UTC times (with `Z` suffix)

### Ordering

All list endpoints return records ordered by their primary datetime
field (most recent first):

- Feedings: ordered by `fed_at` (descending)
- Diapers: ordered by `changed_at` (descending)
- Naps: ordered by `napped_at` (descending)
- Children: ordered by `date_of_birth` (descending, youngest first)

### Pagination

The API uses Django REST Framework's default pagination. Check the response for `next` and `previous` links:

```json
{
  "count": 50,
  "next": "http://localhost:8000/api/v1/children/1/feedings/?page=2",
  "previous": null,
  "results": [...]
}
```
