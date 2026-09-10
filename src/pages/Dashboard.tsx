import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Download, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { demoHouseholds } from '../data/households';
import { demoAlerts, downloadCsv, formatDemoDate } from '../data/workspace';

export default function Dashboard() {
    const { user } = useAuth();
    const { animals, transfers } = useWorkspace();
    const { i18n } = useTranslation();
    const [allAlerts, setAllAlerts] = useState(false);
    const rw = i18n.language === 'rw';
    const sectors = [...new Set(demoHouseholds.map(h => h.location.sector))].map(name => ({ name, households: demoHouseholds.filter(h => h.location.sector === name).length, enrolled: demoHouseholds.filter(h => h.location.sector === name && h.programs.girinka.status === 'enrolled').length }));
    const cards = [
        { label: rw ? 'Amatungo' : 'Livestock', value: animals.length, color: 'blue', path: '/livestock', note: rw ? 'Amatungo yanditswe' : 'Registered animals' },
        { label: rw ? 'Imiryango yose' : 'Total Households', value: demoHouseholds.length, color: 'yellow', path: '/households', note: rw ? `Imirenge ${sectors.length}` : `Across ${sectors.length} sectors` },
        { label: rw ? 'Inyana zatanzwe' : 'Calf Transfers', value: transfers.length, color: 'green', path: '/transfers', note: `${transfers.filter(item => item.status === 'Pending').length} ${rw ? 'zirategereje' : 'awaiting approval'}` },
    ];
    return <div className="overview-page">
        <section className="dashboard-welcome"><h1>{rw ? 'Murakaza neza' : 'Welcome'}, {user?.name.split(' ')[0]}</h1><p>{rw ? 'Kurikirana imiryango, amatungo n’ubufasha.' : 'View & manage households, livestock and community support'}</p></section>
        <div className="overview-stats">{cards.map(card => <Link key={card.path} to={card.path} className={`summary-card ${card.color}`}><div className="summary-main"><h2>{card.label}</h2><div><strong>{card.value.toLocaleString()}</strong><span className="summary-link"><ArrowUpRight size={13} />{rw ? 'Reba' : 'View'}</span></div></div><div className="summary-footer">{card.note}</div></Link>)}</div>
        <section className="sector-chart panel"><div className="panel-heading"><h2>{rw ? 'Imiryango kuri buri murenge' : 'Households by Sector'}</h2><span>{rw ? 'Amakuru y’icyitegererezo' : 'Demo data'}</span></div><div className="sector-chart-canvas" role="img" aria-label={sectors.map(sector => `${sector.name}: ${sector.households} households`).join(', ')}><ResponsiveContainer width="100%" height="100%"><BarChart data={sectors} margin={{ top: 18, right: 18, bottom: 18, left: 2 }}><CartesianGrid stroke="#edf2f8" vertical={false} /><XAxis dataKey="name" tick={{ fill: '#62718a', fontSize: 11 }} axisLine={false} tickLine={false} dy={9} /><YAxis allowDecimals={false} tick={{ fill: '#62718a', fontSize: 10 }} axisLine={false} tickLine={false} width={32} /><Tooltip cursor={{ fill: '#f3f7f4' }} contentStyle={{ border: '1px solid #e8ecef', borderRadius: 8, fontSize: 12 }} /><Bar dataKey="households" name={rw ? 'Imiryango' : 'Households'} fill="#00643b" radius={[5, 5, 0, 0]} maxBarSize={34} /></BarChart></ResponsiveContainer></div><p className="chart-axis-title">{rw ? 'Umurenge' : 'Sector'}</p></section>
        <section className="dashboard-lower"><div className="alerts-heading"><h2>{rw ? 'Amakuru mashya' : 'Recent Alerts'}</h2><div><button className="workspace-button" onClick={() => downloadCsv('isonga-alerts.csv', [['Name', 'Alert', 'Date', 'Category'], ...demoAlerts.map(alert => [alert.name, alert.text, alert.date, alert.type])])}><Download size={14} />{rw ? 'Kuramo' : 'Download'}</button><button className="workspace-button dark" onClick={() => setAllAlerts(!allAlerts)}>{allAlerts ? (rw ? 'Reba make' : 'Show less') : (rw ? 'Reba yose' : 'View all')}</button></div></div>
            <div className="dashboard-bottom-grid"><div className="alert-card panel">{demoAlerts.slice(0, allAlerts ? undefined : 3).map((alert, index) => <Link to={alert.path} className="alert-row" key={alert.id}><span className={`alert-avatar avatar-${index % 3}`}>{alert.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div className="alert-copy"><strong>{alert.name}</strong><span>{alert.text}</span><small>{formatDemoDate(alert.date)}</small></div><ChevronRight size={16} /></Link>)}<p className="demo-footnote">{rw ? 'Amakuru y’icyitegererezo gusa' : 'Fictional records for demonstration'}</p></div>
                <section className="distribution-card panel"><div><h2>{rw ? 'Ikwirakwizwa rya Girinka' : 'Girinka Distribution'}</h2><p>{rw ? 'Imiryango yanditswe kuri buri murenge' : 'Enrolled households by sector'}</p></div><div className="distribution-bars">{sectors.map(sector => <div key={sector.name}><span>{sector.name}</span><div><i style={{ width: `${sector.enrolled / sector.households * 100}%` }} /></div><strong>{sector.enrolled}</strong></div>)}</div><div className="distribution-footer"><span><i />{rw ? 'Yanditswe muri Girinka' : 'Girinka enrolled'}</span><Link to="/programs">{rw ? 'Reba gahunda' : 'View programs'}<ArrowUpRight size={14} /></Link></div></section>
            </div>
        </section>
    </div>;
}
