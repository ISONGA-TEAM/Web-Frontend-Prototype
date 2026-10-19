// Placeholder eligibility criteria. MINALOC configures the real list (REQ-08, TBD-2); replace before the pilot.
export const girinkaCriteria = [
    { key: 'poor_household', en: 'Household meets the MINALOC poverty / vulnerability criteria', rw: 'Umuryango wujuje ibisabwa by’ubukene/ubuvunge bya MINALOC' },
    { key: 'no_cow', en: 'Household does not currently own a cow', rw: 'Umuryango nta nka ufite ubu' },
    { key: 'shelter', en: 'Has a cowshed or space to build one', rw: 'Ufite ikiraro cyangwa ahantu hacyubakwa' },
    { key: 'fodder', en: 'Has land planted (or planned) with fodder', rw: 'Ufite ubutaka buhinzeho (cyangwa buteganyijwe) ubwatsi' },
    { key: 'resident', en: 'Is a resident of the village', rw: 'Atuye muri uyu mudugudu' },
] as const;
export const evidenceTypes = ['document', 'visit', 'witness', 'none'] as const;
export const vulnerabilityOptions = ['Female-headed', 'Elderly head', 'Child-headed', 'Person with disability', 'Landless / small plot', 'Recent returnee'] as const;
export const productList = {
    vaccination: ['FMD vaccine', 'Lumpy skin disease vaccine', 'Anthrax vaccine', 'Brucellosis vaccine'],
    deworming: ['Albendazole', 'Ivermectin'],
    treatment: ['Oxytetracycline', 'Acaricide spray', 'Vitamin supplement'],
    vet_visit: ['Routine visit', 'Emergency visit'],
    body_condition: ['BCS'],
    pregnancy_check: ['Service / insemination date'],
} as const;
