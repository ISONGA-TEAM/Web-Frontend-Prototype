import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Render the actual pages with their providers, without requiring a browser.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let currentUser = { id: 'demo-district', name: 'Jean Habimana', email: 'district@example.com', role: 'district_officer' };
globalThis.localStorage = { getItem: () => JSON.stringify(currentUser) };
try {
    const { demoHouseholds } = await server.ssrLoadModule('/src/data/households.ts');
    const { demoAnimals, demoTransfers } = await server.ssrLoadModule('/src/data/workspace.ts');
    assert.equal(new Set(demoHouseholds.map(item => item.id)).size, 30);
    assert.equal(new Set(demoHouseholds.map(item => item.location.sector)).size, 10);
    assert.equal(demoAnimals.length, 132);
    assert.equal(demoTransfers.length, 24);
    assert.equal(new Set(demoAnimals.map(item => item.id)).size, demoAnimals.length);
    assert(demoAnimals.every(animal => demoHouseholds.some(household => household.id === animal.householdId && household.headName === animal.name && household.location.sector === animal.sector)));
    assert(demoTransfers.every(transfer => demoAnimals.some(animal => animal.id === transfer.animalId)));
    assert.deepEqual(['Cattle', 'Goats', 'Poultry', 'Sheep'].map(species => demoAnimals.filter(animal => animal.species === species).length), [108, 6, 6, 12]);

    await server.ssrLoadModule('/src/i18n/index.ts');
    const { AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
    const { WorkspaceProvider } = await server.ssrLoadModule('/src/context/WorkspaceContext.tsx');
    const { default: Dashboard } = await server.ssrLoadModule('/src/pages/Dashboard.tsx');
    const { default: Livestock } = await server.ssrLoadModule('/src/pages/LivestockMonitoring.tsx');
    const { default: Transfers } = await server.ssrLoadModule('/src/pages/CalfTransfers.tsx');
    const { default: Sidebar } = await server.ssrLoadModule('/src/components/Sidebar.tsx');
    const render = (Component, path) => renderToString(React.createElement(AuthProvider, null,
        React.createElement(WorkspaceProvider, null, React.createElement(MemoryRouter, { initialEntries: [path] },
            React.createElement(Routes, null, React.createElement(Route, { path, element: React.createElement(Component) }))))));
    const dashboard = render(Dashboard, '/dashboard');
    assert.match(dashboard, /Welcome/);
    assert.match(dashboard, />132</);
    assert.match(dashboard, />30</);
    assert.match(dashboard, />24</);
    assert.match(dashboard, /Across 10 sectors/);
    const livestock = render(Livestock, '/livestock');
    assert.match(livestock, /Add Livestock/);
    assert.equal((livestock.match(/aria-label="View LV-/g) || []).length, 7);
    assert.match(livestock, /household1@example.com/);
    const transfers = render(Transfers, '/transfers');
    assert.equal((transfers.match(/aria-label="View CT-/g) || []).length, 7);
    for (const status of ['Approved', 'Pending', 'Rejected']) assert(transfers.includes(`status-${status.toLowerCase()}`));
    // Even a saved admin session must not automatically authenticate a new app load.
    currentUser = { ...currentUser, role: 'admin' };
    const guestNav = render(Sidebar, '/dashboard');
    assert(!guestNav.includes('Users &amp; Roles'));
    assert(!guestNav.includes('Calf Transfers'));
    const { useAuth } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
    function AuthProbe() {
        return React.createElement('span', null, useAuth().isAuthenticated ? 'authenticated' : 'login-required');
    }
    assert.match(render(AuthProbe, '/dashboard'), /login-required/);
    const { authenticateDemo, demoAccounts, demoPassword } = await server.ssrLoadModule('/src/data/demo.ts');
    for (const account of demoAccounts) assert.equal(authenticateDemo(account.username, demoPassword)?.role, account.role);
    assert.equal(authenticateDemo('district.demo', 'incorrect'), null);
    console.log('PASS: household/animal/transfer relationships, species totals, dashboard totals, both registry renders, seven-row pagination, transfer statuses, demo credentials, and login required despite a saved session.');
} finally {
    await server.close();
    delete globalThis.localStorage;
}
