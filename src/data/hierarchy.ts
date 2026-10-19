// Administrative tree (SRS section 2.2, REQ-01). The pilot seeds one district (Nyabihu);
// other provinces exist as empty nodes. Cell and village names are placeholders, not LODA codes.
export type Level = 'national' | 'province' | 'district' | 'sector' | 'cell' | 'village';
export const levels: Level[] = ['national', 'province', 'district', 'sector', 'cell', 'village'];

export interface AdminNode { id: string; code: string; name: string; level: Level; parentId: string | null; status: 'active' | 'retired'; lat: number; lon: number }

const nodes: AdminNode[] = [];
// Map anchors (REQ-02) are PLACEHOLDERS: provinces are rough centres, everything below is laid out on a grid around
// Nyabihu until MINALOC supplies village centres and the official boundary GeoJSON (TBD-6).
const provinceAnchor: Record<string, [number, number]> = { RW: [-1.94, 29.87], 'P-KGL': [-1.95, 30.06], 'P-S': [-2.45, 29.75], 'P-W': [-2.0, 29.2], 'P-N': [-1.55, 29.85], 'P-E': [-1.95, 30.45], 'D-NYB': [-1.66, 29.5] };
const anchors: Record<string, [number, number]> = { ...provinceAnchor };
const add = (id: string, name: string, level: Level, parentId: string | null) => {
    let [lat, lon] = anchors[id] ?? [0, 0];
    if (!anchors[id] && parentId) {
        const [plat, plon] = anchors[parentId];
        const siblings = nodes.filter(n => n.parentId === parentId).length;
        const spread = level === 'sector' ? 0.055 : level === 'cell' ? 0.014 : 0.0055;
        const cols = level === 'sector' ? 4 : 2;
        const row = Math.floor(siblings / cols), col = siblings % cols;
        const rows = level === 'sector' ? 3 : 2;
        lat = plat + (row - (rows - 1) / 2) * spread; lon = plon + (col - (cols - 1) / 2) * spread;
        anchors[id] = [lat, lon];
    }
    nodes.push({ id, code: `DEMO-${id}`, name, level, parentId, status: 'active', lat, lon });
};

add('RW', 'Rwanda (MINALOC)', 'national', null);
const provinces: [string, string][] = [['P-KGL', 'Kigali City'], ['P-S', 'Southern Province'], ['P-W', 'Western Province'], ['P-N', 'Northern Province'], ['P-E', 'Eastern Province']];
provinces.forEach(([id, name]) => add(id, name, 'province', 'RW'));
add('D-NYB', 'Nyabihu', 'district', 'P-W');
export const pilotSectors = ['Bigogwe', 'Jenda', 'Jomba', 'Kabatwa', 'Karago', 'Kintobo', 'Mukamira', 'Rambura', 'Rurembo', 'Rugera'] as const;
export const sectorId = (name: string) => `S-${name.slice(0, 3).toUpperCase()}`;
pilotSectors.forEach(name => {
    const sid = sectorId(name);
    add(sid, name, 'sector', 'D-NYB');
    [1, 2].forEach(c => {
        const cid = `C-${sid.slice(2)}-${c}`;
        add(cid, `${name} Cell ${c}`, 'cell', sid);
        [1, 2].forEach(v => add(`V-${sid.slice(2)}-${c}-${v}`, `${name} Village ${c}.${v}`, 'village', cid));
    });
});

export const nodeMap: Record<string, AdminNode> = Object.fromEntries(nodes.map(n => [n.id, n]));
export const allNodes = nodes;
export const storeOf = (districtId: string) => `STORE-${districtId}`;

export const childrenOf = (id: string) => nodes.filter(n => n.parentId === id);
export const pathOf = (id: string): AdminNode[] => { const out: AdminNode[] = []; let cur: AdminNode | undefined = nodeMap[id]; while (cur) { out.unshift(cur); cur = cur.parentId ? nodeMap[cur.parentId] : undefined; } return out; };
/** True when `id` is `scopeId` or one of its descendants. */
export const isWithin = (id: string | undefined, scopeId: string) => !!id && pathOf(id).some(n => n.id === scopeId);
export const ancestorAt = (id: string, level: Level) => pathOf(id).find(n => n.level === level);
export const descendantsOf = (id: string, level?: Level) => nodes.filter(n => isWithin(n.id, id) && n.id !== id && (!level || n.level === level));
export const nextLevel = (level: Level): Level | null => levels[levels.indexOf(level) + 1] ?? null;
