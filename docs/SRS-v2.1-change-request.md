# Isonga Girinka: change request against SRS v2.0

Raised from stakeholder feedback on the web prototype. For the SRS authors and the MINALOC Girinka representative to approve, amend or reject.
Status: **draft, not approved**. Nothing here changes the SRS until the Approvals table on page 2 of v2.0 is signed.

## A. New requirements (not in v2.0)

| ID | Proposed requirement | Why | Prototype behaviour |
| --- | --- | --- | --- |
| CR-1 | **Permission administration.** The System Administrator shall be able to grant or revoke any page or action for any user, at any time. Each change needs a recorded reason and is audited. Changes take effect at once and can be reversed, individually or by resetting a user to the role default. | Stakeholders want one role-based experience where features appear according to permissions the highest role controls (feedback items 1 and 6). v2.0 fixes permissions per role (2.4.1) and gives each account exactly one role (REQ-04). | `/permissions`, visible to the System Administrator only. The dashboard is one screen assembled from widget permissions; sidebar, pages, widgets and actions all follow the effective permissions, and the page shows a preview of what the selected user will see. |
| CR-2 | **Export preview.** Before any export is downloaded, the user shall see the columns, the first rows and the total row count. The export formats are CSV, XLSX and a printable view for PDF. | Feedback item 4. REQ-42 lists the formats but has no preview step. | Dialog on every export; the download is audited as in REQ-42. |
| CR-3 | **Saved view sharing.** REQ-37 allows sharing "with users in the same or a lower jurisdiction". Clarify that sharing goes downwards only and that a view opening outside the viewer's jurisdiction falls back to the viewer's own node. | Avoids a lower-level user reaching data above their node through a shared link. | Implemented as clarified. |

### Guard rails proposed for CR-1 (please confirm)

1. These stay fixed and cannot be granted or revoked: permission management, hierarchy management, the dashboard.
2. A grant never widens jurisdiction (REQ-06, C-5). Scope is always the user's own node and below.
3. Approval stays tied to the role at each level of the chain (3.5.1). Granting "approve transfers" to another role does not let them approve at a level that needs a different role.
4. No one can edit their own permissions.
5. The System Administrator still has no access to household personal data (2.4). Permissions never unmask national IDs or phone numbers; masking follows NFR-29.
6. Open question: should a permission change end the user's active sessions, as a role change does under REQ-05? The prototype applies changes immediately without ending sessions.

## B. Already required by v2.0, now implemented

- Clickable chart segments and drill-down along the hierarchy (REQ-35).
- Interactive map with layers and clusters (REQ-40). Positions are placeholders until TBD-6 (boundary data) is decided.
- Everyone sees their node and everything below it (2.4, REQ-06, REQ-33), with personal data masked by role (NFR-29). The National Programme Officer now has the Households page, masked, so the drill-down in REQ-35 can reach households.

## C. Gaps in v2.0 found while building, and what the prototype assumed

Please decide each one; the prototype choice is a placeholder, not a ruling.

| # | Gap in v2.0 | Prototype assumption | Proposed SRS text |
| --- | --- | --- | --- |
| 1 | REQ-15 lets approvers "reject" but 3.5.2 has no Rejected state. | Added a terminal *Rejected* state. | Add the state and its transitions to 3.5.2. |
| 2 | REQ-15 forbids approving your own transfer, but UC-1 has the District Coordinator initiate and give final approval. | Two District Coordinators exist; the second gives final approval. | Say who initiates batch and primary transfers, or allow a deputy. |
| 3 | REQ-25 allows calving only for With Holder or Pregnant, so a Lactating cow cannot record a second calving. | Lactating is allowed. | Add Lactating to REQ-25. |
| 4 | REQ-12 has one status field that mixes custody and reproductive state. | Kept as written. | Split custody status from reproductive state. |
| 5 | 3.5.2 uses "Approved (level 1)" and "Approved (final)", which are not states. | Single-level approvals map to Pending Next Approval or Approved. | Rename or remove them. |
| 6 | REQ-17 requires receipt within 72 hours, but field agents may be offline for 7 days (2.5). | Overdue time uses the dispatch time on the server. | Measure from event time on the device, not sync time. |
| 7 | 5.6 runs materialised-view refresh outside 07:00 to 18:00, but 2.1.1 and NFR-05 need a refresh every 5 minutes. | Dashboards recompute on demand. | Exempt the dashboard refresh from 5.6. |
| 8 | REQ-20 verifies only animals changed in the last 24 hours, so an old tampered row would not be found. | Verification is on demand per animal. | Verify all animals periodically and store the latest hash outside the database. |
| 9 | REQ-04 and REQ-05 cover staff accounts only, but households have a login view. | Household demo account with password. | Define household sign-in (for example phone one-time code) and what happens when a head has no phone. |
| 10 | National IDs are stored encrypted (NFR-20) but REQ-07 and REQ-04 need duplicate checks. | Duplicate check on the plain value in memory. | Add a keyed hash (blind index) for national duplicate detection. |
| 11 | SMS retry differs between REQ-47 (3 over 6 hours) and 4.3.3 (seconds, then hourly for 24 hours). | Not built. | Pick one schedule. |
| 12 | Phase plan puts reports and AI drafting in Phase 4, but the pilot metric "50% less report time" is measured in Phase 3. | Mock assistant built early. | Move the metric or the module. |
| 13 | Quota rule differs: REQ-03 says children cannot exceed the parent; the Target entity says the parent equals the sum. | "Cannot exceed". | Use one rule. |
| 14 | REQ-28 refers to REQ-35 for the pass-on dashboard; it should be REQ-33. NFR-06 refers to REQ-14 for sync conflicts, which REQ-14 does not define. | Ignored. | Correct the references and define sync conflict rules. |

## D. Not built in the prototype, still open

SMS and email delivery, offline sync and PWA install, offline map tiles and official boundary layers, a real language model for the Assistant (TBD-8), national ID lookup, staff invitation flow, exit reversal events.
