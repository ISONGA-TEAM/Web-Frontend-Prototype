import { useEffect, useRef } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '../lib/metrics';

const colours = { ok: '#00643b', warn: '#e5a50a', bad: '#d6303b' } as const;
/** Zoom level at which the map swaps node-level markers for village markers (clusters when zoomed out). */
const VILLAGE_ZOOM = 12;

interface Props { points: MapPoint[]; villages: MapPoint[]; onDrill: (id: string, level: string) => void; label: string }

/**
 * Interactive map (REQ-40). One circle per node, sized by the chosen layer and coloured by severity.
 * Click a circle for its numbers and a drill-down button. Zoom in to see individual villages.
 * Positions are placeholders until the official boundary data arrives (TBD-6). Leaflet is loaded in the browser only.
 */
export default function GirinkaMap({ points, villages, onDrill, label }: Props) {
    const host = useRef<HTMLDivElement>(null);
    const state = useRef<{ L: typeof Leaflet; map: Leaflet.Map; group: Leaflet.LayerGroup; fitted: string } | null>(null);
    const latest = useRef({ points, villages, onDrill });
    latest.current = { points, villages, onDrill };

    const draw = () => {
        const st = state.current; if (!st) return;
        const { L, map, group } = st;
        group.clearLayers();
        const { points: pts, villages: vil, onDrill: drill } = latest.current;
        const useVillages = map.getZoom() >= VILLAGE_ZOOM && vil.length > 0;
        for (const p of useVillages ? vil : pts) {
            const radius = Math.min(30, 8 + Math.sqrt(p.value) * (useVillages ? 3 : 4));
            const marker = L.circleMarker([p.lat, p.lon], { radius, color: colours[p.severity], weight: 2, fillColor: colours[p.severity], fillOpacity: 0.45 });
            const box = document.createElement('div');
            const title = document.createElement('strong'); title.textContent = `${p.name} (${p.level})`; box.appendChild(title);
            const count = document.createElement('div'); count.textContent = `Selected layer: ${p.value}`; box.appendChild(count);
            p.lines.forEach(l => { const d = document.createElement('div'); d.textContent = l; box.appendChild(d); });
            if (p.tags.length) { const d = document.createElement('div'); d.textContent = `Records: ${p.tags.join(', ')}`; d.style.marginTop = '4px'; box.appendChild(d); }
            const btn = document.createElement('button'); btn.textContent = p.level === 'village' ? 'Open this village' : 'Drill down'; btn.style.cssText = 'margin-top:6px;padding:4px 8px;border:1px solid #00643b;border-radius:6px;background:#00643b;color:#fff;cursor:pointer';
            btn.addEventListener('click', () => drill(p.id, p.level)); box.appendChild(btn);
            marker.bindPopup(box); marker.bindTooltip(`${p.name}: ${p.value}`);
            marker.addTo(group);
        }
    };

    useEffect(() => {
        let cancelled = false;
        let observer: ResizeObserver | undefined;
        import('leaflet').then(L => {
            if (cancelled || !host.current || state.current) return;
            const map = L.map(host.current, { scrollWheelZoom: false }).setView([-1.66, 29.5], 10);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
            const group = L.layerGroup().addTo(map);
            state.current = { L, map, group, fitted: '' };
            map.on('zoomend', draw);
            // The container may be collapsed or resized after creation (layout, sidebar, window). Leaflet must be told,
            // otherwise the view drifts to the wrong place. Re-measure, then re-fit to the markers.
            const refit = () => { const st = state.current; if (!st || !host.current || host.current.clientWidth === 0) return; st.map.invalidateSize({ animate: false }); st.fitted = ''; fit(); draw(); };
            observer = new ResizeObserver(refit);
            observer.observe(host.current);
            requestAnimationFrame(refit);
        });
        return () => { cancelled = true; observer?.disconnect(); state.current?.map.remove(); state.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fit = () => {
        const st = state.current; if (!st || !latest.current.points.length) return;
        const key = latest.current.points.map(p => p.id).join('|');
        if (st.fitted === key) return;
        st.fitted = key;
        const b = st.L.latLngBounds(latest.current.points.map(p => [p.lat, p.lon] as [number, number]));
        st.map.fitBounds(b.pad(0.35), { maxZoom: latest.current.points.length === 1 ? 13 : 12 });
    };
    useEffect(() => { fit(); draw(); }); // redraw whenever the layer, filters or node change

    return <div ref={host} role="region" aria-label={label} style={{ height: 340, borderRadius: 10, border: '1px solid #e5e8ed', background: '#eef2ef' }} />;
}
