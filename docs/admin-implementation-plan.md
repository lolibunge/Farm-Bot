# Admin Implementation Plan

This document translates the domain design from [admin-domain-rework.md](./admin-domain-rework.md) into an implementation roadmap for the current codebase.

It is written to help us improve the app in controlled phases without breaking the existing admin.

## Success Criteria

At the end of this roadmap, the admin should:

- show one consistent answer for where each horse is
- show one consistent answer for which group each horse belongs to
- derive group location from horse-level active stays
- allow bulk moves and individual splits/returns without contradictions
- keep a complete horse timeline across movements, health, feed, training, and alerts
- support Telegram reminders and operational actions without hand-maintained duplicated truth

## Current Inventory

## Existing API surface

Current admin write actions are centralized in:

- [api/admin/mutate-data.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/api/admin/mutate-data.js)

Main action families today:

- horse create/update
- paddock save and field work save/update
- horse group save and membership set
- individual grazing move in/out
- group grazing move in/correct current/move out
- feed item and feed event actions
- horse feed plan actions
- deworming, farrier, health, training
- rain, frost, farm settings, admin modules

Current overview/read models are assembled in:

- [api/admin/overview.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/api/admin/overview.js)
- [api/admin/horse-history.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/api/admin/horse-history.js)
- [api/admin/calendar-events.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/api/admin/calendar-events.js)

## Existing domain services

Current farm operations are concentrated in:

- [lib/paddocks.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/paddocks.js)
- [lib/feed-plans.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/feed-plans.js)
- [lib/farm-settings.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/farm-settings.js)
- [lib/rain-registry.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/rain-registry.js)
- [lib/frost-registry.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/frost-registry.js)
- [lib/admin-modules.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/admin-modules.js)
- [lib/horse-profile.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/horse-profile.js)

## Existing tables already in use

Already modeled in the app:

- `horses`
- `paddocks`
- `horse_groups`
- `horse_group_memberships`
- `horse_group_membership_history`
- `grazing_events`
- `paddock_work_events`
- `feed_items`
- `feed_events`
- `horse_feed_plan_items`
- `horse_feed_slot_entries`
- `deworming_events`
- `farrier_events`
- `horse_health_events`
- `rain_registry`
- `frost_registry`
- `farm_settings`
- `admin_module_settings`

## Main source of current conflicts

The app currently mixes three truths that should be related but not confused:

- group membership
- active physical location
- derived group location

This leads to valid but confusing states like:

- 3 horses belong to `In Training`
- only 2 have active occupancy in `Semicircular`
- UI cards present both facts without clearly saying they are different views

## Implementation Strategy

We should not replace everything in one shot.

The safest approach is:

1. add canonical structures beside existing ones
2. backfill from current data
3. dual-write in service layer
4. switch reads to new projections
5. simplify old tables only after the UI and services are stable

## Phase 0: Freeze Rules and Prepare Refactor

Goal:

- make the target model explicit before schema and UI work

Deliverables:

- keep [admin-domain-rework.md](./admin-domain-rework.md) as source of product truth
- use this document as technical execution plan
- identify data inconsistencies before migration work starts

Tasks:

- document every admin write flow and its intended business result
- list real examples of split groups, moved individuals, manual rest overrides, and current pain points
- export a data snapshot before any migration

Recommended commit order:

1. `docs: add admin domain and implementation roadmap`
2. `docs: capture real movement edge cases and migration notes`

## Phase 1: Introduce Canonical Movement Model

Goal:

- make horse-level group and horse-level location the canonical truth

## 1.1 New or transitional tables

Add these tables first without deleting current ones:

- `movement_batches`
- `horse_group_membership_periods`

Recommended schema:

### `movement_batches`

- `id`
- `movement_type`
- `effective_date`
- `source_group_id`
- `target_group_id`
- `source_location_id`
- `target_location_id`
- `reason`
- `notes`
- `performed_by`
- `created_at`

### `horse_group_membership_periods`

- `id`
- `horse_id`
- `group_id`
- `started_at`
- `ended_at`
- `movement_batch_id`
- `source`
- `notes`
- `created_at`
- `updated_at`

## 1.2 Transitional column additions

Before renaming any existing table, add bridge columns:

- add `movement_batch_id` to `grazing_events`
- add `movement_batch_id` to `horse_group_membership_history`
- add `location_type` to `paddocks`

For now:

- keep `paddocks` table name
- treat it as the backing table for future `locations`

Initial allowed values for `location_type`:

- `paddock`
- `corral`
- `manga`
- `house`
- `other`

## 1.3 Backfill rules

Backfill `horse_group_membership_periods` from:

- current rows in `horse_group_memberships`
- historical rows in `horse_group_membership_history`

Backfill `movement_batches` only for new writes at first.
Do not attempt a perfect historical reconstruction on day one unless necessary.

## 1.4 Service extraction

Split [lib/paddocks.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/lib/paddocks.js) into smaller domain modules:

- `lib/locations.js`
- `lib/groups.js`
- `lib/movements.js`
- `lib/location-readiness.js`
- `lib/read-models.js`

Transitional option:

- keep `lib/paddocks.js` as a compatibility facade
- move logic behind exported functions gradually

## 1.5 Canonical write rules

All new movement operations should go through one service layer that:

- opens/closes horse group membership periods
- opens/closes horse location stays
- creates one movement batch for bulk actions
- runs in one transaction

Required service methods:

- `saveLocation()`
- `saveGroup()`
- `assignGroupMembers()` for non-location group-only changes
- `moveGroupToLocation()`
- `moveHorseToLocation()`
- `splitHorsesFromGroupToGroupAndLocation()`
- `returnHorsesToGroupAndLocation()`
- `correctHorseLocationStay()`
- `correctGroupLocationStay()`

Recommended commit order:

1. `db: add movement batch and membership period tables`
2. `db: add movement batch references and location type bridge columns`
3. `refactor: extract movement services from paddocks module`
4. `feat: dual-write group membership changes into canonical periods`
5. `feat: dual-write location moves with movement batches`

## Phase 2: Build Stable Read Models

Goal:

- stop letting each screen compute its own meaning

Create explicit backend read-model functions:

- `listHorseCurrentState()`
- `listGroupCurrentState()`
- `listLocationCurrentState()`
- `listLocationReadinessState()`
- `listMovementTimeline()`
- `listHorseTimeline(horseId)`

## 2.1 Horse Current State

Each row should include:

- horse identity
- current group
- current location
- days in current location
- current training status
- latest health markers
- feed summary
- due alerts summary

## 2.2 Group Current State

Each row should include:

- total active members
- members in same location
- members in other locations
- members without active location
- derived group state:
  - `cohesive`
  - `split`
  - `partial`
  - `empty`
- derived current locations summary

## 2.3 Location Current State

Each row should include:

- location identity
- active horses there
- groups represented there
- entered date summary
- occupancy age
- readiness / rest summary

## 2.4 Read-model source of truth

These projections should read from:

- `horse_group_membership_periods`
- `grazing_events` for now, later `horse_location_stays`
- `movement_batches`
- `paddock_work_events`

Do not derive current state from UI assumptions.

Recommended commit order:

1. `feat: add horse current state read model`
2. `feat: add group current state read model`
3. `feat: add location current state read model`
4. `feat: add movement timeline read model`
5. `refactor: switch overview API to explicit read models`

## Phase 3: Refactor API Surface

Goal:

- reduce the giant action multiplexer over time

We do not need to delete `mutate-data` immediately, but new flows should move toward dedicated endpoints.

## 3.1 Keep temporarily

- `GET /api/admin/overview`
- `GET /api/admin/horse-history`
- `GET /api/admin/calendar-events`
- `POST /api/admin/mutate-data`

## 3.2 Add dedicated endpoints

Recommended new endpoints:

### Horses

- `GET /api/admin/horses`
- `GET /api/admin/horses/:id`
- `POST /api/admin/horses`
- `POST /api/admin/horses/:id/profile`

### Groups

- `GET /api/admin/groups`
- `GET /api/admin/groups/:id`
- `POST /api/admin/groups`
- `POST /api/admin/groups/:id/members`

### Locations

- `GET /api/admin/locations`
- `GET /api/admin/locations/:id`
- `POST /api/admin/locations`
- `POST /api/admin/locations/:id/field-events`

### Movements

- `GET /api/admin/movements`
- `POST /api/admin/movements/group`
- `POST /api/admin/movements/horse`
- `POST /api/admin/movements/split`
- `POST /api/admin/movements/return`
- `POST /api/admin/movements/correction`

### Alerts

- `GET /api/admin/alerts`
- `POST /api/admin/alerts/:id/resolve`
- `POST /api/admin/alerts/settings`

### Feed / Stock

- `GET /api/admin/feed`
- `GET /api/admin/stock`
- `POST /api/admin/stock/movements`
- `POST /api/admin/feed/horse-events`

## 3.3 Compatibility plan

For a few releases:

- let old UI keep using `mutate-data`
- route old actions internally to new service functions
- build new admin screens against dedicated endpoints

Recommended commit order:

1. `feat: add dedicated groups and locations read endpoints`
2. `feat: add dedicated movement endpoints`
3. `refactor: route mutate-data movement actions through new movement service`
4. `feat: add alerts endpoints`

## Phase 4: Rebuild the Admin by Domain

Goal:

- make the UI reflect the real business concepts

Recommended order of screen refactor:

## 4.1 Groups / Lots

Replace ambiguous counts with explicit summaries:

- `3 members`
- `2 currently in Semicircular`
- `1 unassigned`

Group detail should show:

- members list
- current location breakdown
- recent joins/leaves
- recent movement batches

Files likely impacted:

- [admin/app.js](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/admin/app.js)
- [admin/index.html](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/admin/index.html)
- [admin/styles.css](/Users/loli/Documents/GitHub/GitLoli/Farm-Bot/admin/styles.css)

## 4.2 Locations

Split "setup", "occupancy", and "readiness" more clearly.

Location detail should show:

- current active horses
- current groups represented
- occupancy entered date
- days occupied
- rest days
- readiness source:
  - history
  - manual estimate
  - field work

## 4.3 Movements

Create one dedicated movement workspace with:

- move full group
- split horses out of group
- return horses into group
- move individual horse
- correct past move

Every action should preview:

- horses affected
- current group/location
- target group/location
- what will be closed
- what will be opened

## 4.4 Horse profile

The horse profile becomes the main operational file.

Tabs or sections:

- current state
- movement history
- group history
- feed history
- health history
- training history
- notes
- due alerts

Recommended commit order:

1. `ui: add explicit group cohesion summary`
2. `ui: separate location occupancy from location readiness`
3. `ui: add dedicated movement workspace`
4. `ui: rebuild horse profile as unified timeline`

## Phase 5: Stabilize Feed, Health, and Training Timelines

Goal:

- keep these modules independent in storage if needed, but unified in the horse experience

## 5.1 Feed

Keep current base:

- `feed_items`
- `feed_events`
- `horse_feed_plan_items`
- `horse_feed_slot_entries`

Improve by:

- introducing stock movement semantics
- distinguishing purchase vs consumption vs adjustment
- supporting horse or group-linked deductions

Add:

- `stock_movements`

## 5.2 Health

Current events already exist:

- `deworming_events`
- `farrier_events`
- `horse_health_events`

Short-term recommendation:

- keep tables
- unify rendering into one horse health timeline

Long-term option:

- migrate toward `horse_health_events` with typed categories

## 5.3 Training

Current training is still partly stored on `horses.training_status`.

Short-term:

- keep current field for quick summaries

Add:

- `horse_training_events`

Then derive current training state from latest event plus optional quick-status cache.

Recommended commit order:

1. `db: add stock movements table`
2. `db: add horse training events table`
3. `feat: unify horse feed and stock timeline`
4. `feat: unify horse health timeline`
5. `feat: unify horse training timeline`

## Phase 6: Alerts and Telegram Integration

Goal:

- turn reminders into first-class operational workflows

## 6.1 New tables

- `alert_rules`
- `alerts`
- `alert_deliveries`

## 6.2 Rule types

- stock threshold
- deworming due
- farrier due
- trimming due
- vaccine due
- treatment follow-up

## 6.3 Alert lifecycle

Alert states:

- `pending`
- `soon`
- `due_today`
- `overdue`
- `resolved`
- `dismissed`

## 6.4 Telegram behavior

Telegram actions should be able to:

- notify low stock
- notify due horse care
- resolve by registering the actual event

Example:

- receive deworming due alert
- reply with a command or guided bot action
- write `deworming_events`
- close previous alert
- calculate next due date

Recommended commit order:

1. `db: add alert tables`
2. `feat: generate stock and care alerts from current data`
3. `feat: show alert center in admin`
4. `feat: add telegram delivery and resolution flows`

## Phase 7: Finance

Goal:

- connect operational management with costs and income

Add:

- `financial_entries`
- optional `financial_categories`

Support:

- expense
- income
- horse-linked expense
- group-linked expense
- location/field-work expense
- feed purchase

This should be a later phase because it depends less on movement correctness than the rest of the app.

## Data Migration and Cleanup Checklist

Before switching reads to the new canonical views, run cleanup scripts for:

- horses with no active group but expected to be grouped
- horses with more than one active group membership
- horses with more than one active grazing event
- groups whose members are split across locations without clear operational meaning
- paddocks marked resting but with active occupants
- manual rest values that conflict with movement history

Recommended migration scripts:

- `scripts/backfill-group-membership-periods.js`
- `scripts/backfill-movement-batches.js`
- `scripts/audit-active-group-conflicts.js`
- `scripts/audit-active-location-conflicts.js`
- `scripts/audit-rest-readiness-conflicts.js`

## Testing Plan

Add business-level tests around real farm scenarios.

Minimum scenarios:

1. Create a group and assign 3 horses.
2. Move the full group to one paddock.
3. Split 1 horse out to another group and another location.
4. Return that horse to the original group.
5. Show correct group summary:
   - total members
   - currently together
   - elsewhere
   - unassigned
6. Block horse in two active locations.
7. Block horse in two active groups.
8. Block entering a resting/blocked location without override.
9. Preserve horse timeline integrity across movement corrections.
10. Trigger alerts from due care and low stock.

Recommended test layers:

- unit tests for service rules
- integration tests for DB transactions
- UI smoke tests for the main admin flows

## Recommended Execution Order

If we want the cleanest path with the least rework, the order should be:

1. Phase 0: freeze rules and prepare
2. Phase 1: canonical movement model
3. Phase 2: stable read models
4. Phase 3: API refactor with backward compatibility
5. Phase 4: groups, locations, movements, horse profile UI
6. Phase 5: unified feed/health/training timelines
7. Phase 6: alerts and Telegram
8. Phase 7: finance

## What I Recommend We Build Next

The best immediate next milestone is:

### Milestone A: Movement Foundation

Scope:

- add `movement_batches`
- add `horse_group_membership_periods`
- add bridge columns
- extract movement service
- dual-write group membership and grazing moves

Definition of done:

- every group move and individual split has one transactional batch
- current group and current location are queryable per horse
- no new writes depend on UI-side assumptions

### Milestone B: Consistent Admin State

Scope:

- add group and location read models
- switch overview to them
- update admin cards to show explicit cohesive/split/partial states

Definition of done:

- group cards and paddock cards no longer disagree silently
- the UI explains why a group can have 3 members but only 2 in one location

These two milestones will eliminate most of the conflicts you are feeling in the admin today.

