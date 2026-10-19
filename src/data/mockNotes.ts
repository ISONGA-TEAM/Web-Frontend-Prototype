// Mock Kinyarwanda field notes, as if transcribed from village agents' voice notes (FUT-6) or typed in the field app.
// Fictional. They exist so the assistant has Kinyarwanda text to summarise.
export interface FieldNote { id: string; villageId: string; daysAgo: number; text: string; en: string }

export const fieldNotes: FieldNote[] = [
    { id: 'FN-01', villageId: 'V-BIG-1-1', daysAgo: 2, text: 'Inka yacu yabyaye inyana y’ingore ejo, ariko ntiturayishyiraho ikarita.', en: 'Our cow gave birth to a female calf yesterday, but it has no tag yet.' },
    { id: 'FN-02', villageId: 'V-BIG-1-1', daysAgo: 5, text: 'Abaturage barifuza gukingiza inka ariko umuganga w’amatungo ntaragera mu mudugudu.', en: 'Residents want their cows vaccinated but the animal health worker has not come to the village.' },
    { id: 'FN-03', villageId: 'V-BIG-1-2', daysAgo: 3, text: 'Inyana yacu imaze umwaka urenga, turategereje umuryango izahabwa.', en: 'Our calf is over a year old; we are waiting to hear which household will receive it.' },
    { id: 'FN-04', villageId: 'V-BIG-1-2', daysAgo: 8, text: 'Ubwatsi bwabaye buke kubera izuba ryinshi, inka zirananutse.', en: 'Fodder is scarce because of the long dry spell and the cows have grown thin.' },
    { id: 'FN-05', villageId: 'V-BIG-2-1', daysAgo: 1, text: 'Inka yapfuye nijoro, nta cyemezo cy’umuganga turabona.', en: 'A cow died in the night; we do not yet have a vet certificate.' },
    { id: 'FN-06', villageId: 'V-BIG-2-1', daysAgo: 6, text: 'Inka yagejejwe ku muryango ariko ikarita ntiyahuye n’iyo ku rupapuro.', en: 'The cow arrived at the household but its tag did not match the paper.' },
    { id: 'FN-07', villageId: 'V-BIG-2-2', daysAgo: 4, text: 'Twasuye imiryango itatu, ikiraro kimwe gikeneye gusanwa kuko cyuzura amazi.', en: 'We visited three households; one cowshed needs repair because it floods.' },
    { id: 'FN-08', villageId: 'V-JEN-1-1', daysAgo: 7, text: 'Inka ifite inda y’amezi umunani, turasaba gukurikiranwa n’umuganga.', en: 'A cow is eight months pregnant; we ask for a vet to follow up.' },
];

export const themes: { key: string; rw: string; en: string; words: string[] }[] = [
    { key: 'tag', rw: 'Amakarita atarashyirwaho cyangwa adahuye', en: 'Tags missing or not matching', words: ['ikarita'] },
    { key: 'vaccination', rw: 'Inkingo n’umuganga w’amatungo', en: 'Vaccination and animal health worker', words: ['gukingiza', 'umuganga'] },
    { key: 'passon', rw: 'Gutanga inyana', en: 'Calf pass-on', words: ['inyana', 'umuryango izahabwa'] },
    { key: 'fodder', rw: 'Ubwatsi n’ibiraro', en: 'Fodder and cowsheds', words: ['ubwatsi', 'ikiraro'] },
    { key: 'death', rw: 'Inka zipfuye zitaragenzurwa', en: 'Deaths not yet verified', words: ['yapfuye'] },
];
