# Swim meet points tracker — requirements

## Overview

A single-page, mobile-first web app for parents to track their team's points during a Tri-County Swim Association (NJ) summer swim meet. The app runs entirely in the browser with no backend, no login, and no server. State is persisted via a browser cookie.

---

## Technology constraints

- Vanilla HTML and JavaScript only — no frameworks (no React, no Astro, no Vue)
- No backend, no server, no authentication
- Single `.html`, `.css`, and `javascript` files
- CSS is minimal — focus is on functionality, not visual polish
- Mobile-first layout (target viewport: ~390px wide, portrait orientation)

---

## Data persistence

- All state is saved to a browser cookie named `swimMeetTracker`
- The cookie persists for **30 days** from the last time it was written
- The cookie is rewritten every time the user changes any checkbox
- On app load, the cookie is read and all checkboxes are restored to their saved state
- If no cookie exists, the app loads with all checkboxes unchecked and a total of 0

---

## Events

The app tracks **7 events** for one team. Events are displayed in the following order:

1. Medley relay *(relay)*
2. Individual medley *(individual)*
3. Freestyle *(individual)*
4. Backstroke *(individual)*
5. Breaststroke *(individual)*
6. Butterfly *(individual)*
7. Freestyle relay *(relay)*

---

## Scoring rules

### Relay events (medley relay, freestyle relay)

| Result | Points |
|--------|--------|
| Win    | 7      |
| None   | 0      |

### Individual events (individual medley, freestyle, backstroke, breaststroke, butterfly)

| Place  | Points |
|--------|--------|
| 1st    | 5      |
| 2nd    | 3      |
| 3rd    | 1      |
| None   | 0      |

---

## UI — event controls

### Relay events

Each relay event displays two options: **Win** and **None**.

- Implemented as **radio buttons** (mutually exclusive — selecting one deselects the other)
- Default state: neither selected
- Points awarded: 7 for Win, 0 for None

### Individual events

Each individual event displays four options: **1st**, **2nd**, **3rd**, and **None**.

- Implemented as **independent checkboxes** (multiple places can be checked simultaneously, e.g., a team can take both 1st and 2nd in the same event)
- **None** is a checkbox that, when checked, clears the 1st, 2nd, and 3rd checkboxes for that event; conversely, checking any of 1st, 2nd, or 3rd unchecks None
- Default state: all unchecked
- Points awarded per checked box: 5 for 1st, 3 for 2nd, 1 for 3rd, 0 for None

A team can accumulate points from multiple places in the same individual event. For example, checking both 1st and 2nd scores 5 + 3 = 8 points for that event.

---

## UI — layout

- Each event is shown as a labeled row or card
- Event name is clearly displayed
- Controls (radio buttons or checkboxes) are displayed inline next to each label
- Controls should be large enough to tap comfortably on a phone screen
- Events are listed in the order defined above, scrollable vertically

---

## UI — total points bar

- A fixed bar is pinned to the **bottom of the screen** at all times, even while scrolling
- It displays: `Total: X pts` where X is the running point total
- The total updates immediately whenever any checkbox or radio button changes
- The reset button (see below) is also placed in this bar

---

## Reset behavior

- A **Reset** button appears in the fixed bottom bar
- When tapped, a **confirmation dialog** appears (using the browser's native `confirm()`) with a message such as: *"Reset all selections and clear saved data?"*
- If the user confirms, all checkboxes and radio buttons are cleared, the total resets to 0, and the cookie is deleted
- If the user cancels, nothing changes

---

## State calculation

Total points = sum of points from all checked individual event checkboxes + sum of points from all relay radio buttons set to "Win"

The total is recalculated and displayed live on every input change.

---

## Future considerations (out of scope for v1)

- Expanding from 7 test events to full age-group event sets
- Any visual styling or theming beyond functional layout
