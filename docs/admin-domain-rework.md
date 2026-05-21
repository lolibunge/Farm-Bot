# Admin Domain Rework

## Purpose

Turn the admin into the operational source of truth for the farm:

- horses
- groups/lots
- paddocks and corrals
- location changes
- feeding and stock
- health and veterinary care
- training
- rain, seeding, and paddock readiness
- finance
- alerts and Telegram reminders

This document defines the domain model, the data rules, the admin structure, and the migration direction needed to stop patching isolated flows.

## Current Codebase Snapshot

Today the admin already has a strong base, but several responsibilities are mixed together:

- `lib/paddocks.js` currently owns paddocks, horse groups, memberships, movement logic, paddock status, paddock occupancy, and paddock work.
- `api/admin/overview.js` builds a large operational read model by combining horses, groups, paddocks, feed, deworming, farrier, rain, and recent activity in one response.
- Group membership and paddock occupancy are related, but they are not modeled as one unified operational flow.
- Some screens show group membership counts, while others show only active grazing occupancy, which is why the UI can feel contradictory.

Examples of current tension:

- A group can have 3 members while a paddock occupancy card shows only 2 horses because the third horse belongs to the group but does not have an active location stay there.
- A paddock can have a manual rest estimate and also a movement history, and the UI may show the effective rest rather than the raw manual value.
- Moving a group and editing group members are separate workflows, so the user has to mentally reconcile them.

## Core Design Principles

### 1. The horse is the primary unit of truth

Every operational fact must always be answerable at horse level:

- what group is this horse in
- where is this horse now
- since when
- what has this horse eaten
- what health actions were done
- what training work was done
- what alerts are pending

Groups, paddocks, stock views, and dashboards are projections on top of horse-level and location-level history.

### 2. Membership and location are different concepts

A horse can belong to a group and also be physically located somewhere, but those are not the same thing.

- Group membership answers: "Which lot is this horse part of right now?"
- Location occupancy answers: "Where is this horse physically right now?"

These must be connected, but never collapsed into one field.

### 3. Current state must be derived from history

The canonical source of truth should be history tables with open/closed periods:

- active group membership = period with `ended_at IS NULL`
- active location stay = period with `exited_at IS NULL`

Current-state cards, counts, and summaries should be derived from those periods. This removes duplicated truth and reduces drift.

### 4. Group location is a derived concept

A group should not own an independent "current paddock" field as canonical truth.

Instead:

- if all active members are in the same location, the group is considered to be there
- if some members are elsewhere, the group is split
- if some members have no active location, the group is partial/unassigned

This directly solves the confusion between "3 horses in the group" and "2 horses in the paddock".

### 5. Every bulk movement must still create horse-level records

Moving a group is a convenience action, not a separate kind of reality.

A group move should:

- create one movement batch record
- close/open each affected horse's location stay
- optionally close/open each affected horse's group membership if the action includes a group change
- leave a trace that the horses were moved together

## Canonical Domain Model

## Horses

Each horse has a long-lived identity and descriptive data.

Recommended entity:

- `horses`

Key fields:

- `id`
- `name`
- `description`
- `color`
- `date_of_birth`
- `sex`
- `activity`
- `active`
- `created_at`
- `updated_at`

Derived/current projections:

- current group
- current location
- days in current location
- current training status
- pending health alerts

## Groups / Lots

Groups represent operational organization by season or use.

Recommended entity:

- `horse_groups`

Key rules:

- a horse can belong to only one active group at a time
- a group can exist with zero horses
- a group can be active even if split across locations

Recommended canonical history table:

- `horse_group_membership_periods`

Key fields:

- `id`
- `horse_id`
- `group_id`
- `started_at`
- `ended_at`
- `source`
- `movement_batch_id`
- `notes`
- `created_at`
- `updated_at`

This should replace the current duplication between "current memberships" and "membership history".

## Locations

The domain concept should be `locations`, not only paddocks.

Location types:

- paddock
- corral
- manga
- house
- box
- other

Recommended entity:

- `locations`

Key fields:

- `id`
- `name`
- `location_type`
- `description`
- `zone`
- `size_ha`
- `active`
- `parent_location_id`
- `notes`
- `created_at`
- `updated_at`

Migration note:

- the current `paddocks` table can evolve into `locations`, or it can keep its name temporarily and gain `location_type`
- the UI can still say "Potreros" while the model becomes location-aware

## Horse Location Stays

This is the canonical record of where a horse physically is.

Recommended entity:

- `horse_location_stays`

Key fields:

- `id`
- `horse_id`
- `location_id`
- `entered_at`
- `exited_at`
- `entry_notes`
- `exit_notes`
- `source_group_id`
- `movement_batch_id`
- `telegram_user_id`
- `created_at`
- `updated_at`

Migration note:

- the current `grazing_events` table is already very close to this model
- the name should eventually change because not all locations are grazing paddocks

## Movement Batches

A movement batch captures the user action that moved one or many horses together.

Recommended entity:

- `movement_batches`

Key fields:

- `id`
- `movement_type`
- `source_group_id`
- `target_group_id`
- `source_location_id`
- `target_location_id`
- `effective_date`
- `reason`
- `performed_by`
- `notes`
- `created_at`

Example movement types:

- `group_move`
- `individual_move`
- `group_split`
- `group_merge`
- `return_to_group`
- `correction`

This gives us a clean operational history while keeping horse-level truth.

## Field / Location Work

Location readiness should remain independent from horse occupancy.

Recommended entity:

- `location_field_events`

Key fields:

- `id`
- `location_id`
- `event_type`
- `event_date`
- `ready_after_days`
- `ready_to_graze_on`
- `applies_to_descendants`
- `seed_type`
- `notes`
- `created_at`
- `updated_at`

Examples:

- soil prep
- seeding
- fertilizer
- spraying
- ready check

## Rain

Recommended entity:

- `rain_events`

Key fields:

- `id`
- `event_date`
- `mm`
- `notes`
- `created_at`

Rain remains separate, but location readiness views should be able to reference it.

## Feeding and Stock

Keep horse consumption and stock movement related, but separate.

Recommended entities:

- `feed_items`
- `stock_movements`
- `horse_feed_plans`
- `horse_feed_events`
- optional `group_feed_events`

Stock movement examples:

- purchase
- manual adjustment
- horse consumption
- group consumption
- spoilage

Every stock deduction should reference the operational cause when possible.

## Health and Care

The current split by module is workable, but the model should unify the event pattern.

Recommended entities:

- `horse_health_events`
- `horse_treatment_plans`

Health event types:

- vaccine
- deworming
- farrier
- trimming
- injury
- treatment
- vet_check
- observation

Key fields:

- `horse_id`
- `event_type`
- `event_date`
- `product_name`
- `next_due_date`
- `status`
- `notes`
- `created_at`

If migration risk is too high, existing separate tables can stay temporarily, but the admin should present them through one horse health timeline.

## Training

Recommended entities:

- `horse_training_events`
- optional `horse_training_status_periods`

Training event examples:

- in training
- breaking in
- played chukka
- light work
- rest
- observation

## Finance

Recommended entities:

- `financial_entries`
- optional `financial_categories`

Types:

- expense
- income
- transfer

## Alerts and Telegram

Alerts should be a first-class subsystem, not just ad hoc comparisons in code.

Recommended entities:

- `alert_rules`
- `alerts`
- `alert_deliveries`

Alert sources:

- stock thresholds
- deworming due
- farrier due
- trimming due
- vaccines due
- treatment follow-up
- pasture ready
- rain anomalies

Key rule:

- alerts are derived from rule tables plus operational history
- resolving an alert should ideally register the operational event that closed it

## Business Rules

The admin should enforce these rules at service level and at database level where practical.

### Horse rules

- one horse cannot have more than one active group membership
- one horse cannot have more than one active location stay
- a horse cannot exit a location before it entered
- a horse cannot be added to a second group without closing the previous one

### Group rules

- a group can have any number of members, including zero
- a group's current location is derived from its members
- if members are split, the group status is `split`
- if some members have no location, the group status is `partial`

### Location rules

- a location in forced rest or blocked by field work cannot accept new occupancy without an override
- a location cannot show `resting` while it has active occupants
- a location can be parent of child locations
- descendant rules must be explicit when work or manual rest should apply to the full block

### Movement rules

- moving a horse or group must close any previous active location stay unless the action is a correction workflow
- moving horses between groups and locations in one action must happen transactionally
- a batch action must either fully succeed or fully fail
- duplicate open entries for the same horse must be blocked

## Derived Read Models

The admin should stop deriving current-state meaning independently in each screen.

Recommended read models:

- `horse_current_state_view`
- `group_current_state_view`
- `location_current_state_view`
- `location_readiness_view`
- `stock_current_view`
- `horse_due_alerts_view`

### Horse Current State

Should answer:

- current group
- current location
- days in location
- latest health/training/feed summaries
- pending alerts

### Group Current State

Should answer:

- total active members
- members currently in the same location
- members elsewhere
- members unassigned
- current group status: `cohesive`, `split`, `partial`, `empty`

### Location Current State

Should answer:

- who is there right now
- which groups are represented
- active horse count
- entered dates
- days occupied
- rest status
- readiness status

This is the right place to show messages like:

- `3 horses in group`
- `2 currently in Semicircular`
- `1 unassigned`

## Admin Structure

Recommended top-level views:

- Dashboard
- Horses
- Groups
- Locations
- Movements
- Feeding and Stock
- Health
- Training
- Weather and Field Work
- Finance
- Alerts
- Global History

## Key UX Rules

### Horses

Each horse gets a single timeline with filters:

- group changes
- location changes
- feed
- health
- training
- notes

### Groups

Each group should show:

- current members
- current group status
- current locations summary
- recent additions/removals
- movement history

### Locations

Each location should show:

- current horses
- current groups represented
- occupied since
- rest days
- field work history
- rain context
- ready-to-graze estimate

### Movements

The movement screen should support:

- move whole group
- split horses out of group
- return horses into group
- move an individual horse
- correction workflows

Every movement action should preview its consequences before save.

## Recommended Data Strategy

## Keep

- `horses`
- `horse_groups`
- most feed, rain, and existing admin module infrastructure

## Evolve

- `paddocks` into `locations` or add `location_type`
- `grazing_events` into `horse_location_stays`
- `paddock_work_events` into `location_field_events`

## Replace or collapse

- replace the dual current/history group membership model with one canonical period table
- derive all current membership from periods with `ended_at IS NULL`

## Phased Refactor Plan

### Phase 1: Fix the movement domain

Scope:

- define horse-level current group and current location as canonical truth
- introduce or migrate toward `horse_group_membership_periods`
- introduce `movement_batches`
- unify group and horse movement services
- make group location derived from member locations

Outcome:

- group/member/location conflicts stop being ambiguous

### Phase 2: Refactor admin read models

Scope:

- create explicit read-model functions/views for horse, group, and location current state
- replace mixed calculations in UI with backend summaries
- show split and partial group states clearly

Outcome:

- admin cards stop disagreeing with one another

### Phase 3: Unify health, training, and feed timelines

Scope:

- centralize horse timelines
- align alerts with real event history
- keep existing tables where needed, but expose one coherent horse story

Outcome:

- every horse has one readable operational life history

### Phase 4: Alerts and Telegram actions

Scope:

- configurable thresholds and cadences in DB
- pending/soon/overdue alert generation
- resolve alerts from admin and Telegram

Outcome:

- the app becomes an operational assistant, not just a registry

### Phase 5: Finance

Scope:

- simple expense/income tracking tied to horses, groups, locations, feed, and field work when useful

Outcome:

- traceability from management decisions to cost

## Immediate Development Priorities

If we start implementation from this document, the first work items should be:

1. Redefine the canonical movement model around horse membership periods and horse location stays.
2. Add movement batch support so group moves and splits remain traceable.
3. Build backend summaries for group cohesion:
   - total members
   - members in current location
   - members elsewhere
   - unassigned members
4. Update admin group and location views to show those summaries instead of mixing incompatible counts.
5. Only after that, continue with alerts, richer horse timelines, and finance.

## Summary

The core architectural decision is:

- horse-level periods are the source of truth
- group state and location state are derived projections
- bulk actions are convenience commands, not separate reality

That is the cleanest way to support:

- large seasonal lots
- temporary splits
- individual removals and returns
- paddock and corral history
- accurate days in place
- traceable feeding, health, training, and alerts

