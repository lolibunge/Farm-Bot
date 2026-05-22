# Admin V2 Architecture

This route is the clean-room start for the new admin redesign.

## Goal

Ship the new Figma-inspired admin without disturbing the current `/admin/` implementation.

## New Route

- Frontend entry: `/admin-v2/`
- Main API contract: `/api/admin-v2/stock-dashboard`

The current admin remains untouched in `/admin/` and still owns its existing UI and write flows.

## Structure

### Frontend

- `admin-v2/index.html`
- `admin-v2/styles.css`
- `admin-v2/app.js`
- `admin-v2/src/config.js`
- `admin-v2/src/api.js`
- `admin-v2/src/store.js`
- `admin-v2/src/render.js`
- `admin-v2/src/formatters.js`

### Backend

- `api/admin-v2/stock-dashboard.js`
- `lib/admin-v2/stock-dashboard.js`

## Current Scope

Phase 1 intentionally focuses on architecture, shell, and read contracts:

- isolated route
- isolated API namespace
- Figma-inspired layout shell
- reused auth session from existing admin
- stock read adapter with graceful fallbacks for missing columns
- disabled action buttons so writes can be added later without reworking the UI

## Data Strategy

The new stock adapter already supports two modes:

- real data from current `feed_items`
- optional enrichment if future columns exist, like category, supplier, unit cost, or minimum stock

That means we can evolve the schema without rewriting the new frontend contract.

## Next Steps

1. Add write endpoints under `api/admin-v2/*` instead of binding the new UI directly to legacy mutations.
2. Expand the stock contract with movements timeline and accounting aggregates.
3. Introduce new read models per module (`horses`, `paddocks`, `calendar`, etc.) behind the same shell.
