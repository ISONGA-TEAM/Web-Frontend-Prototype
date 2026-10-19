import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Exercises the SRS business rules and renders the real pages with their providers, without a browser.
// Recharts warns about zero-size containers when rendered on the server; the warning is expected here.
const realError = console.error; const realWarn = console.warn;
const quiet = fn => (...args) => { if (String(args[0]).includes('width(-1)')) return; fn(...args); };
console.error = quiet(realError); console.warn = quiet(realWarn);
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
    const load = path => server.ssrLoadModule(path);
    const { buildSeed } = await load('/src/data/seed.ts');
    const { allNodes, pilotSectors } = await load('/src/data/hierarchy.ts');
    const E = await load('/src/lib/engine.ts');
    const R = await load('/src/lib/rules.ts');
    const { visible } = await load('/src/lib/scope.ts');

    let s = buildSeed();
    const U = id => s.users.find(u => u.id === id);
    const district = U('U-district'), district2 = U('U-district2'), sector = U('U-sector-BIG'), cell = U('U-cell-BIG-1'), agent = U('U-agent-BIG-1-1'), household = U('U-hh-0');
    const step = (result, label) => { assert.equal(result.ok, true, `${label}: ${result.errors?.map(e => e.message).join('; ')}`); s = result.s; return result; };
    const refused = (result, rule, label) => { assert.equal(result.ok, false, `${label} should be refused`); assert(result.errors.some(e => e.rule === rule), `${label}: expected rule ${rule}, got ${result.errors.map(e => e.rule)}`); s = result.s; };

    // ---- Hierarchy (REQ-01)
    assert.equal(pilotSectors.length, 10);
    assert.equal(allNodes.filter(n => n.level === 'province').length, 5);
    assert.equal(allNodes.filter(n => n.level === 'village').length, 40);

    // ---- Seed integrity
    assert.equal(new Set(s.animals.map(a => a.tag)).size, s.animals.length, 'tags are unique');
    assert(s.animals.every(a => R.verifyLedger(a).ok), 'every seeded ledger verifies');
    assert(s.transfers.every(t => s.animals.some(a => a.id === t.animalId)));
    assert.equal(s.households.length, 60);

    // ---- Ledger tamper detection (REQ-20)
    const tampered = structuredClone(s.animals.find(a => a.ledger.length >= 2));
    tampered.ledger[0].to = 'someone-else';
    assert.equal(R.verifyLedger(tampered).ok, false);

    // ---- Jurisdiction scoping (REQ-06)
    const forSector = visible(s, sector), forHousehold = visible(s, household), forDistrict = visible(s, district);
    assert(forSector.households.every(h => h.villageId.startsWith('V-BIG')), 'sector officer sees only own sector');
    assert(forSector.households.length < forDistrict.households.length);
    assert.equal(forHousehold.households.length, 1);
    assert(forHousehold.transfers.every(t => t.to.id === 'HH-0001' || t.from.id === 'HH-0001'));
    const otherSectorTransfer = s.transfers.find(t => t.state === 'Pending Next Approval');
    refused(E.decideTransfer(s, sector, otherSectorTransfer.id, 'approve', ''), 'approval', 'out-of-scope / wrong-level approval');
    refused(E.registerHousehold(s, agent, { headName: 'X', nid: '1234', sex: 'F', dob: '1980-01-01', size: 4, villageId: 'V-BIG-1-1', phone: '0780000000', shelter: '', vulnerability: [] }), 'nid_format', 'bad NID');
    refused(E.registerHousehold(s, agent, { headName: 'X', nid: '1198580000000000', sex: 'F', dob: '1980-01-01', size: 4, villageId: 'V-JEN-1-1', phone: '0780000000', shelter: '', vulnerability: [] }), 'jurisdiction', 'cross-village registration');
    assert(s.audit.some(a => a.result === 'denied'), 'denied attempts are audited');

    // ---- Full primary transfer lifecycle (REQ-14 to REQ-20)
    const free = s.animals.find(a => a.tag === 'RW-GN-109');
    const receiver = s.households.find(h => h.id === 'HH-0040');
    const input = { type: 'primary', animalId: free.id, from: free.holder, to: { kind: 'household', id: receiver.id, nodeId: receiver.villageId }, plannedDate: new Date().toISOString().slice(0, 10), reason: 'Test allocation' };
    refused(E.createTransfer(s, agent, input), 'jurisdiction', 'village agent cannot create out-of-scope transfer');
    const created = step(E.createTransfer(s, district, input), 'create');
    const id = created.id;
    refused(E.createTransfer(s, district, input), 'one_open_transfer', 'second open transfer');
    step(E.submitTransfer(s, district, id), 'submit');
    refused(E.decideTransfer(s, district, id, 'approve', ''), 'approval', 'creator cannot approve');
    const secOfficer = s.users.find(u => u.role === 'sector_officer' && u.nodeId === `S-${receiver.villageId.split('-')[1]}`);
    refused(E.decideTransfer(s, district2, id, 'approve', ''), 'approval', 'level 2 approver cannot skip level 1');
    step(E.decideTransfer(s, secOfficer, id, 'return', 'Missing shelter check'), 'return');
    assert.equal(s.transfers.find(t => t.id === id).state, 'Returned');
    step(E.submitTransfer(s, district, id), 'resubmit');
    step(E.decideTransfer(s, secOfficer, id, 'approve', ''), 'approve 1');
    assert.equal(s.transfers.find(t => t.id === id).state, 'Pending Next Approval');
    step(E.decideTransfer(s, district2, id, 'approve', ''), 'approve 2');
    assert.equal(s.transfers.find(t => t.id === id).state, 'Approved');
    refused(E.dispatchTransfer(s, district, id, { sender: '', senderNid: '1', transport: '', photos: [], gps: '' }), 'sender', 'dispatch needs sender confirmation');
    step(E.dispatchTransfer(s, district, id, { sender: 'Store keeper', senderNid: '1198580000000099', transport: 'Truck', photos: ['a.jpg'], gps: '' }), 'dispatch');
    assert.equal(s.animals.find(a => a.id === free.id).status, 'Allocated (In Transit)');
    const recvOfficer = s.users.find(u => u.role === 'cell_officer' && u.nodeId === `C-${receiver.villageId.split('-').slice(1, 3).join('-')}`);
    step(E.receiveTransfer(s, recvOfficer, id, { tagRead: 'WRONG-TAG', sex: 'Female', condition: 'good', remarks: '' }), 'mismatching receipt');
    assert.equal(s.transfers.find(t => t.id === id).state, 'Disputed');
    assert(R.computeAlerts(s).some(a => a.id === `disputed:${id}`), 'dispute raises an alert');
    step(E.resolveDispute(s, district, id, 'accept', 'Tag re-read on site'), 'resolve');
    refused(E.acknowledgeTransfer(s, recvOfficer, id, 'otp', '000000', 'PWA'), 'otp', 'wrong one-time code');
    refused(E.completeTransfer(s, recvOfficer, id), 'ack', 'cannot complete without acknowledgment');
    step(E.acknowledgeTransfer(s, recvOfficer, id, 'otp', E.otpFor(s.transfers.find(t => t.id === id)), 'PWA'), 'acknowledge');
    const done = s.animals.find(a => a.id === free.id);
    assert.equal(s.transfers.find(t => t.id === id).state, 'Completed');
    assert.equal(done.holder.id, receiver.id);
    assert.equal(done.status, 'With Holder');
    assert.equal(done.ledger.length, 2);
    assert(R.verifyLedger(done).ok);
    refused(E.createTransfer(s, district, { ...input, animalId: s.animals.find(a => a.tag === 'RW-GN-108').id }), 'already_served', 'served household cannot receive again');
    step(E.reverseTransfer(s, district, id, 'Entered in error'), 'reverse');
    assert.equal(s.transfers.at(-1).type, 'reversal');
    assert.equal(s.transfers.at(-1).reversalOf, id);
    assert.equal(s.transfers.find(t => t.id === id).state, 'Completed', 'original record is unchanged');

    // ---- State machine
    assert(R.canTransition('Draft', 'Submitted') && !R.canTransition('Draft', 'Completed') && !R.canTransition('Completed', 'Cancelled') && !R.canTransition('Dispatched', 'Cancelled'));

    // ---- Pass-on tasks (REQ-26 to REQ-28)
    const tasks = R.passOnTasks(s);
    const col = c => tasks.filter(t => t.column === c).length;
    assert(col('Task created') >= 2 && col('Nominated') >= 1 && col('Approved') >= 1 && col('Handed over') >= 1 && col('Confirmed') >= 1, JSON.stringify(R.passOnColumns.map(col)));
    assert(tasks.some(t => t.severity === 'red') && tasks.some(t => t.severity === 'amber'));
    const male = s.animals.find(a => a.tag === 'RW-GN-1007');
    assert(!tasks.some(t => t.calfId === male.id), 'male calves are not subject to pass-on');
    const dead = s.animals.find(a => a.tag === 'RW-GN-1008'), next = s.animals.find(a => a.tag === 'RW-GN-1009');
    assert(!tasks.some(t => t.calfId === dead.id) && tasks.some(t => t.calfId === next.id), 'next female calf becomes the candidate');
    const calfA = s.animals.find(a => a.tag === 'RW-GN-1001');
    const nominee = s.households.find(h => h.id === 'HH-0041');
    refused(E.nominatePassOn(s, agent, s.animals.find(a => a.tag === 'RW-GN-1006').id, nominee.id), 'pass_on_age', 'calf not yet old enough');
    step(E.nominatePassOn(s, agent, calfA.id, nominee.id), 'nominate pass-on');
    assert.equal(R.passOnTasks(s).find(t => t.calfId === calfA.id).column, 'Nominated');
    step(E.decideTransfer(s, cell, s.transfers.at(-1).id, 'approve', ''), 'cell approves pass-on');
    step(E.decideTransfer(s, sector, s.transfers.at(-1).id, 'approve', ''), 'sector approves pass-on');
    assert.equal(R.passOnTasks(s).find(t => t.calfId === calfA.id).column, 'Approved');

    // ---- Exit events (REQ-22)
    const cow = s.animals.find(a => a.tag === 'RW-GN-0001');
    refused(E.recordExit(s, agent, { animalId: cow.id, date: '2026-01-01', category: 'cull', cause: 'Old', evidence: 'photo' }), 'cull_evidence', 'cull needs a vet certificate');
    const cow2 = s.animals.find(a => a.tag === 'RW-GN-0003');
    const ex = step(E.recordExit(s, U('U-cell-BIG-2'), { animalId: cow2.id, date: '2026-01-01', category: 'death', cause: 'Illness', evidence: 'witness_statement' }), 'death without certificate');
    assert.equal(s.exits.find(e => e.id === ex.id).state, 'Pending Verification');
    assert.notEqual(s.animals.find(a => a.id === cow2.id).status, 'Deceased');
    step(E.verifyExit(s, sector, ex.id, 'verify', 'Examined the remains'), 'verify');
    assert.equal(s.animals.find(a => a.id === cow2.id).status, 'Deceased');
    step(E.closeChain(s, district, cow2.id), 'close chain');
    assert.equal(s.animals.find(a => a.id === cow2.id).status, 'Closed Chain');

    // ---- Calving, health, alerts
    const dam = s.animals.find(a => a.tag === 'RW-GN-0001');
    refused(E.recordHealth(s, agent, { animalId: dam.id, type: 'vaccination', date: '2026-01-01', product: 'Magic potion', dose: '', remarks: '' }), 'configured_list', 'products come from a configured list');
    const calved = step(E.recordCalving(s, agent, { damId: s.animals.find(a => a.tag === 'RW-GN-0001').id, date: new Date().toISOString().slice(0, 10), calves: [{ sex: 'Female', weight: 28, tag: '' }], complications: '' }), 'calving');
    const newCalf = s.animals.find(a => a.id === calved.id);
    assert(newCalf.tag.startsWith('UNTAGGED') && newCalf.damId && newCalf.holder.id === 'HH-0001');
    const alerts = R.computeAlerts(s);
    for (const rule of ['Receipt overdue', 'Pass-on overdue', 'Death without evidence', 'Vaccination due']) assert(alerts.some(a => a.rule === rule), `alert rule: ${rule}`);
    step(E.setAlertState(s, district, alerts[0].id, 'Acknowledged', ''), 'acknowledge alert');
    refused(E.setAlertState(s, district, alerts[0].id, 'Resolved', ''), 'note', 'resolution needs a note');

    // ---- Targets (REQ-03, REQ-39)
    refused(E.setTarget(s, U('U-national'), 'D-NYB', 500, 400, 'too big'), 'quota', 'child quota cannot exceed parent');
    const prog = R.targetProgress(s, 'D-NYB');
    assert(prog.target === 70 && prog.achieved > 0 && prog.projected >= prog.achieved);

    // ---- Configuration
    refused(E.setConfig(s, district, { passOnAgeMonths: 6 }), 'permission', 'only admin / national change thresholds');
    step(E.setConfig(s, U('U-admin'), { passOnAgeMonths: 12 }), 'config');

    // ---- Mock assistant (REQ-44, REQ-45)
    const A = await load('/src/lib/assistant.ts');
    const secData = visible(s, sector);
    const rwAns = A.answer(s, sector, secData, 'Inyana zigeze igihe cyo gutangwa ni zingahe?', 'rw', 0);
    assert.equal(rwAns.intent, 'passon'); assert(rwAns.text.startsWith('Mu Bigogwe'), rwAns.text); assert(rwAns.sources.every(x => x.id.startsWith('Q-')) && rwAns.sources.length >= 3);
    assert.equal(A.answer(s, sector, secData, 'How is Imihigo progress?', 'en', 0).intent, 'target');
    assert.equal(A.answer(s, sector, secData, 'zzz', 'en', 0).intent, 'help');
    const noteAns = A.answer(s, sector, secData, "Mpa incamake y'inyandiko z'abakozi bo mu midugudu", 'rw', 0);
    assert.equal(noteAns.intent, 'notes'); assert(noteAns.text.includes('inyandiko'));
    assert(A.summariseNotes(sector, 'rw').notes.every(n => n.villageId.startsWith('V-BIG')), 'notes are scoped to the jurisdiction');
    const scrubbed = A.scrub(`${s.households[1].headName} 1198580000000000 0781234567`, s);
    assert(!scrubbed.includes(s.households[1].headName.split(' ')[0]) && scrubbed.includes('[ID]') && scrubbed.includes('[PHONE]'), scrubbed);
    const draftRw = A.draftReport(s, sector, secData, 'weekly_sector', 'rw', 0);
    assert(draftRw.paragraphs.length >= 7 && draftRw.paragraphs.slice(1).every(p => p.sources.length > 0));
    refused(E.logAssistant(s, household, 'question', 'x', 'y'), 'permission', 'households do not use the assistant');
    step(E.logAssistant(s, sector, 'draft', 'weekly_sector', 'output'), 'assistant is audited');
    assert(s.audit.some(a => a.action === 'ai.draft'));

    // ---- Permissions managed by the System Administrator (reversible)
    const routesMod = await load('/src/routes.tsx');
    const admin = U('U-admin'), nationalOfficer = U('U-national');
    R.setCurrentGrants({});
    assert.equal(R.can(agent, 'page_reports', s.grants), false, 'village agents have no reports page by default');
    refused(E.setPermission(s, district, agent.id, 'page_reports', 'grant', 'x'), 'permission', 'only the administrator manages permissions');
    refused(E.setPermission(s, admin, agent.id, 'page_reports', 'grant', ''), 'reason', 'a reason is required');
    refused(E.setPermission(s, admin, admin.id, 'page_reports', 'grant', 'self'), 'self', 'no self-edit');
    refused(E.setPermission(s, admin, agent.id, 'manage_permissions', 'grant', 'escalate'), 'locked', 'locked permission');
    step(E.setPermission(s, admin, agent.id, 'page_reports', 'grant', 'Needs village-level reporting'), 'grant a page');
    assert.equal(R.can(agent, 'page_reports', s.grants), true);
    assert(routesMod.pathsFor(agent, s.grants).includes('/reports') && !routesMod.pathsFor(agent, {}).includes('/reports'), 'the page appears only after the grant');
    step(E.setPermission(s, admin, agent.id, 'page_reports', 'reset', 'Reverting'), 'reverse a grant');
    assert.equal(R.can(agent, 'page_reports', s.grants), false); assert.equal(s.grants[agent.id], undefined, 'no leftover override');
    // revoking an action blocks it in the engine, and is reversible
    step(E.setPermission(s, admin, sector.id, 'assess', 'revoke', 'Training not finished'), 'revoke an action');
    const hh = s.households.find(h => h.status === 'Registered' && h.villageId.startsWith('V-BIG'));
    refused(E.assessHousehold(s, sector, hh.id, []), 'permission', 'revoked permission is enforced');
    step(E.setPermission(s, admin, sector.id, 'assess', 'grant', 'Training done'), 'restore an action');
    assert.equal(R.can(sector, 'assess', s.grants), true);
    // granting approval never lets the wrong role approve at a level (the chain is tied to roles)
    step(E.setPermission(s, admin, agent.id, 'approve_transfer', 'grant', 'Test'), 'grant approval to a village agent');
    const waiting = s.transfers.find(t => t.state === 'Submitted' && t.type === 'primary');
    assert.notEqual(R.approvalDenial(agent, waiting, s.grants), null, 'a village agent still cannot approve at the sector level');
    step(E.setPermission(s, admin, sector.id, 'approve_transfer', 'revoke', 'Leave'), 'revoke approval');
    assert.notEqual(R.approvalDenial(sector, waiting, s.grants), null);
    step(E.resetPermissions(s, admin, sector.id, 'Back to defaults'), 'reset');
    step(E.resetPermissions(s, admin, agent.id, 'Back to defaults'), 'reset');
    assert.deepEqual(s.grants, {});
    assert(s.audit.some(a => a.action === 'permission.grant') && s.audit.some(a => a.action === 'permission.reset'), 'permission changes are audited');
    assert(routesMod.pathsFor(nationalOfficer, {}).includes('/households'), 'national officers see households downward (masked)');

    // ---- One dashboard assembled from widget permissions
    const widgetsOf = (u, g = s.grants) => R.permissionsOf(u, g).filter(a => a.startsWith('widget_'));
    for (const u of s.users.filter(x => ['U-admin', 'U-national', 'U-auditor', 'U-province', 'U-district', 'U-sector-BIG', 'U-cell-BIG-1', 'U-agent-BIG-1-1', 'U-hh-0'].includes(x.id))) assert(widgetsOf(u).length >= 3, `${u.role} has dashboard widgets`);
    assert(!widgetsOf(agent).includes('widget_pipeline'));
    step(E.setPermission(s, admin, agent.id, 'widget_pipeline', 'grant', 'Wants the pipeline'), 'grant a widget');
    assert(widgetsOf(agent).includes('widget_pipeline'), 'granted widget appears');
    step(E.setPermission(s, admin, agent.id, 'widget_worklist', 'revoke', 'No worklist'), 'revoke a widget');
    assert(!widgetsOf(agent).includes('widget_worklist'), 'revoked widget disappears');
    step(E.resetPermissions(s, admin, agent.id, 'Back to defaults'), 'reset widgets');
    assert(widgetsOf(agent).includes('widget_worklist') && !widgetsOf(agent).includes('widget_pipeline'));

    // ---- Map layers (REQ-40)
    const M = await load('/src/lib/metrics.ts');
    const dData = visible(s, district);
    const f = M.emptyFilters('D-NYB');
    for (const l of M.mapLayers) {
        const pts = M.mapPoints(s, dData, f, l.key, ['S-BIG', 'S-JEN']);
        assert(pts.length === 2 && pts.every(p => Number.isFinite(p.lat) && Number.isFinite(p.lon)), `map layer ${l.key}`);
        assert(pts.every(p => !JSON.stringify(p).match(/HABIMANA|MUKAMANA|1198580/)), 'markers carry no household names or IDs');
    }
    const holders = M.mapPoints(s, dData, f, 'holders', ['S-BIG']);
    assert(holders[0].value > 0 && holders[0].tags.length > 0 && holders[0].tags.every(t => /^(RW-GN|UNTAGGED)/.test(t)), 'markers list animal tags only');

    // ---- Saved views (REQ-37)
    const { isWithin } = await load('/src/data/hierarchy.ts');
    refused(E.saveView(s, household, 'x', 'node=S-BIG', 'holders', false), 'permission', 'households have no saved views');
    refused(E.saveView(s, sector, '  ', 'node=S-BIG', 'holders', false), 'required', 'a view needs a name');
    const sv = step(E.saveView(s, sector, 'Overdue pass-ons this week', 'node=C-BIG-1&ttype=pass_on', 'passon', true), 'save a shared view');
    refused(E.saveView(s, sector, 'overdue pass-ons this week', 'x', 'holders', false), 'duplicate', 'duplicate name');
    const seenBy = u => s.savedViews.filter(v => v.shared && v.ownerId !== u.id && isWithin(u.nodeId, v.ownerNodeId)).length;
    assert.equal(seenBy(agent), 1, 'a village agent below the sector sees the shared view');
    assert.equal(seenBy(district), 0, 'shared views go downwards only, never up');
    refused(E.deleteView(s, agent, sv.id), 'not_found', 'only the owner deletes a view');
    step(E.deleteView(s, sector, sv.id), 'owner deletes the view');
    assert.equal(s.savedViews.length, 0);

    if (process.env.RENDER === '0') { console.log('Domain checks passed (page rendering skipped).'); process.exit(0); }
    // ---- Pages render for every role
    await load('/src/i18n/index.ts');
    const { AuthProvider } = await load('/src/context/AuthContext.tsx');
    const { StoreProvider } = await load('/src/context/StoreContext.tsx');
    R.setCurrentGrants({});
    const roleUser = { system_admin: 'U-admin', national_officer: 'U-national', provincial_officer: 'U-province', district_coordinator: 'U-district', sector_officer: 'U-sector-BIG', cell_officer: 'U-cell-BIG-1', village_agent: 'U-agent-BIG-1-1', household: 'U-hh-0', auditor: 'U-auditor' };
    const { default: Layout } = await load('/src/components/Layout.tsx');
    const routes = await load('/src/routes.tsx');
    for (const [role, uid] of Object.entries(roleUser)) {
        const account = s.users.find(u => u.id === uid);
        for (const path of routes.pathsFor(account, {})) {
            const html = renderToString(React.createElement(AuthProvider, { initialUser: account }, React.createElement(StoreProvider, null, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Routes, null, React.createElement(Route, { element: React.createElement(Layout) }, routes.appRoutes()))))));
            assert(html.length > 400, `${role} ${path} rendered`);
            assert(!html.includes('Something went wrong'), `${role} ${path} has no error boundary output`);
        }
    }
    console.log('All workspace checks passed.');
} finally {
    await server.close();
}
