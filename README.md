# Isonga Girinka: web frontend prototype

React + TypeScript + Vite prototype of the **Isonga Girinka Digital Management System**, built from the
Software Requirements Specification v2.0 (18 October 2026). It runs entirely in the browser on fictional
Nyabihu pilot data. There is no backend yet: the rules in `src/lib` are the logic the API must implement.

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check and production build
node scripts/check-workspace.mjs   # business-rule tests plus a render of every page for every role
node scripts/xlsx-check.mjs        # validates the XLSX writer's output (needs python3)
```

## Demo accounts

Password `Isonga2026!`. Roles above Village ask for a one-time code: `246810`.

| Role | Username |
| --- | --- |
| System Administrator (grants and revokes permissions) | `admin.demo` |
| National Programme Officer | `national.demo` |
| Auditor | `auditor.demo` |
| Provincial Officer | `province.demo` |
| District Coordinator (two, so one can approve the other's transfers) | `district.demo`, `district2.demo` |
| Sector Officer (Bigogwe) | `sector.demo` |
| Cell Officer (Bigogwe Cell 1) | `cell.demo` |
| Village Agent (Bigogwe Village 1.1) | `agent.demo` |
| Beneficiary Household | `household.demo` |

Every other sector, cell and village has generated staff (`sector.<code>`, `cell.<code>`, `agent.<code>`; see Administration).
Use **Settings > Reset demo data** to restore the seed.

## Where the SRS lives in the code

| SRS | Code |
| --- | --- |
| Hierarchy (2.2, REQ-01) | `src/data/hierarchy.ts` |
| Roles and permissions matrix (2.4.1) | `src/lib/rules.ts` (`can`, `inScope`) |
| Jurisdiction filtering (REQ-06, C-5) | `src/lib/scope.ts`; every page reads through it |
| Transfer types, approval chains, state machine (3.5) | `src/lib/rules.ts`, `src/lib/engine.ts` |
| Request validation (REQ-14) | `validateTransfer` in `src/lib/rules.ts` |
| Hash-chained ledger (REQ-20) | `appendLedger`, `verifyLedger`, `src/lib/sha256.ts` |
| Pass-on tasks (REQ-26 to 28) | `passOnTasks` in `src/lib/rules.ts`, `src/pages/PassOn.tsx` |
| Alerts and thresholds (REQ-38) | `computeAlerts`, `src/pages/Alerts.tsx`, `src/pages/Admin.tsx` |
| Dashboards, filters, drill-down (REQ-33 to 41) | `src/pages/dash/*`, `src/lib/metrics.ts` |
| Map (REQ-40) | `src/components/GirinkaMap.tsx` (Leaflet), `mapPoints` in `src/lib/metrics.ts` |
| Permissions (granted and revoked by the System Administrator) | `src/lib/rules.ts` (`can`, `permissionsOf`), `setPermission` in `src/lib/engine.ts`, `src/pages/Permissions.tsx` |
| Audit trail (REQ-48) | `audit()` in `src/lib/engine.ts`, `src/pages/Audit.tsx` |

Business rules are pure functions, so they can move to the Node/Express API unchanged.

## Known gaps and deliberate choices

- **Not built:** a real AI model (the Assistant is a mock), SMS/email delivery (REQ-46/47, alerts are in-app only), offline
  sync and PWA install, offline map tiles, official boundary layers (TBD-6), widget layout and resizing (REQ-37),
  national ID lookup, staff invitations, exit reversal events.
- **Permissions beyond the SRS** (change request): the System Administrator can give or take away any page, dashboard widget or action for any
  user (the dashboard is one component assembled from widget permissions), reversibly and with an audited reason. Locked: permission management, hierarchy management and the dashboard.
  Grants never widen jurisdiction and never move the approval chain (approval stays tied to the role in each slot).
- **Export preview** (change request): every export first shows the columns, the first rows and the total, then offers CSV, XLSX or a printable view for PDF.
- **Saved dashboard views** (REQ-37): private by default, shareable downwards only.
- The change requests and 14 gaps found in SRS v2.0 are written up in `docs/SRS-v2.1-change-request.md` for the authors to decide.
- **Map positions are placeholders** until MINALOC supplies village centres and boundary GeoJSON. Tiles load from OpenStreetMap, so the map needs internet.
- **Prototype stand-ins:** the second factor and the household acknowledgment code are shown on screen; photo capture is a
  list of file names; dashboards recompute on demand instead of reading materialised views; live updates are simulated by
  a 5-minute refresh.
- **Spec gaps resolved here** (confirm with MINALOC): a *Rejected* transfer state was added because REQ-15 allows rejecting; a
  lactating cow may calve again (REQ-25 only lists With Holder or Pregnant); batch allocation is recorded when an animal is
  registered at the district store; exits use their own evidence workflow rather than the transfer state machine;
  eligibility criteria are placeholders (`src/data/criteria.ts`).
- Kinyarwanda strings (`src/locales/rw.json`) are a draft and need review by a native speaker. Missing keys fall back to English.
