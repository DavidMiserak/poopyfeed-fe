# Feature Plan: Day-by-Day Timeline

## Context

Dad (Michael) persona needs to stay informed about a child's daily activity history. Currently,
the dashboard shows only a 10-item "Recent Activity" feed with no date navigation. A dedicated
timeline page will let co-parents scroll back through the last 7 days of events (feedings,
diapers, naps) grouped by day, using previous/next day navigation.

---

## Specification

### Overview

The Timeline feature provides a read-only day-by-day view of all logged events for a child.
Users navigate between days using Previous/Next buttons, viewing feedings, diaper changes, and
naps in a unified chronological feed grouped under a daily header. The timeline covers the last
7 days and is accessible as a new route from the child dashboard.

### Functional Requirements (EARS)

**FR-TL-001: Route Access**
The system shall expose a timeline page at `/children/:childId/timeline`, protected by the
auth guard.

**FR-TL-002: Dashboard Entry Point**
When the user taps the "Timeline" action button on the child dashboard,
the system shall navigate to `/children/:childId/timeline` and show a loading spinner on the button during navigation.

**FR-TL-003: Default Day**
When the timeline page loads, the system shall display today's events as the initial view.

**FR-TL-004: Event Display**
While viewing a day, the system shall display each event with its emoji icon, summary title,
and time of occurrence (HH:MM in local timezone), sorted chronologically (oldest first).

**FR-TL-005: Day Header**
The system shall display a day header above the event list using relative labels:
"Today", "Yesterday", or the weekday + date (e.g., "Monday, Feb 23").

**FR-TL-006: Previous Day Navigation**
When the user taps "Previous", the system shall show the prior day's events and update the
day header. The button shall be disabled when the user is 7 days in the past.

**FR-TL-007: Next Day Navigation**
When the user taps "Next", the system shall show the next day's events.
The button shall be disabled when the user is viewing today.

**FR-TL-008: History Limit**
The system shall not allow navigation beyond 7 days before today.

**FR-TL-009: Empty State**
While viewing a day with no events, the system shall display an empty state message:
"No events logged on this day."

**FR-TL-010: Loading State**
While events are being fetched, the system shall display a loading indicator and suppress the
event list.

**FR-TL-011: Error State**
When the data fetch fails, the system shall display: "Unable to load timeline. Please try again."

### Non-Functional Requirements

- **Performance**: 3 parallel API calls with 7-day date range filter (existing query params);
  all client-side day switching (no additional requests after initial load).
- **Security**: Auth-guarded route. Child ownership enforced by backend (existing).
  No PII beyond what the user already has access to on the dashboard.
- **Mobile-first**: Prev/Next buttons sized as full-width or prominent tap targets (≥ 44px).
  One-handed navigation on mobile.

### Acceptance Criteria

**AC-TL-001: Default to today**
Given a user navigating to `/children/:childId/timeline`
When the page loads
Then today's events are shown with the header "Today"
And the "Next" button is disabled

**AC-TL-002: Chronological event order**
Given a day with a feeding at 08:00 and a diaper change at 10:30
When the user views that day
Then the feeding appears above the diaper change

**AC-TL-003: Previous day navigation**
Given the user is viewing today
When they tap "Previous"
Then yesterday's events are shown with the header "Yesterday"
And the "Next" button becomes enabled

**AC-TL-004: 7-day history limit**
Given the user is viewing a day 7 days ago
When they attempt to tap "Previous"
Then the button is disabled/hidden and no navigation occurs

**AC-TL-005: Empty day**
Given no events were logged on a particular day
When the user navigates to that day
Then the message "No events logged on this day." is displayed

**AC-TL-006: Dashboard navigation with spinner**
Given the user is on the child dashboard
When they tap the "Timeline" button
Then a spinner appears on the button immediately
And navigation proceeds to the timeline page

**AC-TL-007: Mixed event types on same day**
Given a day with a feeding, a diaper change, and a nap
When the user views that day
Then all three events appear in the list with their respective icons

### Error Handling

| Error Condition     | Behavior                                                     |
| ------------------- | ------------------------------------------------------------ |
| 401 Unauthorized    | Auth guard redirects to login                                |
| 403 Forbidden       | Backend rejects; show "You don't have access to this child." |
| 404 Child not found | Show "Child not found."                                      |
| Network/5xx error   | Show "Unable to load timeline. Please try again." with retry |

### Out of Scope

- Filtering by event type or sub-type
- Editing or deleting events from the timeline
- History beyond 7 days
- Real-time updates / push notifications
- Multi-child timeline view

---

## Implementation Summary

### Files Created

| File                                                                   | Purpose                          |
| ---------------------------------------------------------------------- | -------------------------------- |
| `front-end/poopyfeed/src/app/children/timeline/child-timeline.ts`      | Timeline component (TypeScript)  |
| `front-end/poopyfeed/src/app/children/timeline/child-timeline.html`    | Timeline template                |
| `front-end/poopyfeed/src/app/children/timeline/child-timeline.css`     | Timeline styles                  |
| `front-end/poopyfeed/src/app/children/timeline/child-timeline.spec.ts` | Vitest unit tests                |
| `front-end/poopyfeed/specs/timeline.spec.md`                           | Feature specification (this doc) |

### Files Modified

| File                                                                  | Change                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `front-end/poopyfeed/src/app/app.routes.ts`                           | Added `/children/:childId/timeline` lazy-loaded route                         |
| `front-end/poopyfeed/src/app/children/dashboard/child-dashboard.ts`   | Added `isNavigatingToTimeline` signal + `navigateToTimeline()` method         |
| `front-end/poopyfeed/src/app/children/dashboard/child-dashboard.html` | Added "Timeline" action button (6th button, updated grid to `md:grid-cols-6`) |

### Key Implementation Details

**Component Architecture**:

- Signals-based state management with Angular 21 patterns
- `dayOffset` signal tracks navigation state (0 = today, max 6 = 7 days back)
- `selectedDate` computed property derives calendar date from `dayOffset`
- `dayActivities` computed property filters and sorts activities for display
- `dayHeader` computed property generates relative day labels
- `canGoPrevious` and `canGoNext` computed properties manage button disabled states

**Data Loading**:

- Single `forkJoin` call loads all 7 days at once (3 API calls in parallel)
- Uses existing date-range query params (`fed_at__gte`, `changed_at__gte`, etc.)
- All day switching is client-side (no additional API requests)

**Styling**:

- Tailwind CSS v4 consistent with dashboard design system
- Decorative background gradients matching app theme
- Full-width responsive buttons for mobile (44px+ tap targets)
- Skeleton loading states with animated gradients

**Testing**:

- 40+ Vitest unit tests covering:
    - Component initialization and data loading
    - Day header labels (Today, Yesterday, formatted dates)
    - Navigation button states and boundaries
    - Event filtering and chronological sorting
    - Activity title generation for all types
    - Empty state, loading state, error state
    - Mixed event types on same day

---

## Verification

### Manual Testing

1. **Start services**: `make run`
2. **Navigate to timeline**: Dashboard → tap "Timeline" button → confirm spinner shows
3. **Verify today's events**:
    - Load timeline for child with events today
    - Confirm events display in chronological order
    - Confirm time format shows HH:MM
4. **Test navigation**:
    - Tap "Previous" → verify yesterday's events display
    - Tap "Previous" 6 times → verify "Previous" button disables
    - Tap "Next" → verify navigation toward today works
    - At today, verify "Next" button is disabled
5. **Empty state**: Navigate to a day with no events → verify message displays
6. **Error handling**: Simulate API error → verify error message displays

### Automated Testing

```bash
cd front-end/poopyfeed
npm test -- src/app/children/timeline/child-timeline.spec.ts
# Expected: All 40+ tests pass
```

### Acceptance Criteria Verification

- ✅ AC-TL-001: Today displayed by default with disabled "Next"
- ✅ AC-TL-002: Events sorted chronologically (oldest first)
- ✅ AC-TL-003: Previous button enables when navigating back
- ✅ AC-TL-004: Previous disabled at 7-day boundary
- ✅ AC-TL-005: Empty state message displays
- ✅ AC-TL-006: Dashboard button shows spinner during navigation
- ✅ AC-TL-007: Mixed event types display with correct icons

---

## Performance Characteristics

- **Initial load**: 3 parallel API calls (~1-2 seconds typical)
- **Day switching**: O(n) filter on existing data (< 100ms for 7 days)
- **Memory**: ~5-10KB for 7 days of typical activity data
- **No additional requests**: All navigation is client-side after initial load

---

## Accessibility

- Auth guard prevents unauthorized access (401 redirects to login)
- Backend enforces child ownership (403 error if not authorized)
- ARIA labels on buttons (`aria-label`, `aria-busy`)
- Loading states clearly indicated with spinners
- High contrast UI following WCAG AA standards
- Semantic HTML with proper heading hierarchy
- Touch targets ≥ 44px for mobile one-handed operation

---

## Future Enhancements

- Filtering by event type (feeding/diaper/nap)
- Extended history (beyond 7 days, paginated)
- Event editing/deletion from timeline
- Real-time activity updates via WebSocket
- Export selected day as PDF/CSV
- Notifications for significant events (first feeding of day, etc.)
