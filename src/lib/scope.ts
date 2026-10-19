// Jurisdiction filtering (REQ-06, C-5). Every page reads data through here, never from the raw store.
import { inScope } from './rules';
import { isWithin } from '../data/hierarchy';
import type { Store, User } from '../types';

export function visible(s: Store, user: User) {
    const own = user.role === 'household';
    const households = own ? s.households.filter(h => h.id === user.householdId) : s.households.filter(h => inScope(user, h.villageId));
    const transfers = s.transfers.filter(t => own ? (t.to.id === user.householdId || t.from.id === user.householdId) : inScope(user, t.from.nodeId) || inScope(user, t.to.nodeId));
    const involved = new Set(transfers.map(t => t.animalId));
    const animals = s.animals.filter(a => own ? a.holder.id === user.householdId || involved.has(a.id) : inScope(user, a.holder.nodeId) || involved.has(a.id));
    const ids = new Set(animals.map(a => a.id));
    return {
        households, transfers, animals,
        exits: s.exits.filter(e => own ? e.holderId === user.householdId : inScope(user, e.nodeId)),
        lists: s.lists.filter(l => !own && (inScope(user, l.nodeId) || isWithin(user.nodeId, l.nodeId))),
        visits: s.visits.filter(v => households.some(h => h.id === v.householdId)),
        healthEvents: s.healthEvents.filter(e => ids.has(e.animalId)),
        calvings: s.calvings.filter(c => ids.has(c.damId)),
        grievances: s.grievances.filter(g => own ? g.householdId === user.householdId : inScope(user, g.nodeId) || (user.role === 'provincial_officer' && Date.now() - new Date(g.raisedOn).getTime() > 30 * 86_400_000)),
    };
}
export type Visible = ReturnType<typeof visible>;
