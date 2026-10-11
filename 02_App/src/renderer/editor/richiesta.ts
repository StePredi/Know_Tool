import type { Modello, Testo } from '@shared/types'

export interface OpzioniRichiesta {
  contesto: boolean
  citazioni: boolean
  domande: boolean
}

/** La richiesta da incollare a Claude: tutto ciò che serve per scrivere `proposta_scheda.md` senza toccare altro. */
export function richiestaPerClaude(m: Modello, t: Testo, o: OpzioniRichiesta): string {
  const base = `01_Argomenti/italiano/autori/${m.autore.id}`
  const scheda = t.scheda ? m.schede.find((s) => s.id === t.scheda) : undefined
  const sezioni = ['## Riassunto  (2-4 righe)', '## Struttura e metrica  (tipo di strofa, schema delle rime, numero di versi, parti del testo)']
  if (o.contesto) sezioni.push('## Contesto  (quando e dove è stato scritto, a quale raccolta appartiene, perché è importante)')
  if (o.citazioni) sezioni.push('## Citazioni chiave  (2-3 elementi, ognuno: «parole copiate PAROLA PER PAROLA dal testo» (v. N): perché conta)')
  if (o.domande) sezioni.push('## Domande  (3-5 domande probabili da interrogazione: "- Domanda?" e sotto, rientrata, la risposta breve)')
  const nParole = t.annotazioni.filter((a) => a.parola_chiave).length
  return [
    `Prepara la proposta di scheda riassuntiva del testo «${t.titolo}» (id: ${t.id}).`,
    '',
    `Cartella: ${base}/`,
    'Prima leggi 00_Control/REGOLE.md e 00_Control/specifiche/scheda_riassuntiva_ai.md.',
    `Poi leggi testi/${t.id}/testo.md, annotazioni.json, parafrasi.json ed esercizi.json (${t.annotazioni.length} annotazioni, ${nParole} parole chiave, ${t.parafrasi.length} parafrasi, ${t.esercizi.length} esercizi).`,
    scheda
      ? `Il testo è già collegato alla scheda «${scheda.id}» (schede/${scheda.id}.md): leggila, la proposta la aggiornerà. Usa id: ${scheda.id}.`
      : 'Il testo non ha ancora una scheda: proponi un id nuovo (minuscole, cifre, underscore) e una categoria.',
    '',
    `Scrivi SOLO il file ${base}/testi/${t.id}/proposta_scheda.md (nessun altro file) così:`,
    '---',
    `id: ${scheda ? scheda.id : '<id_nuovo>'}`,
    `corsia: ${scheda ? scheda.corsia : '<una categoria esistente>'}`,
    'data: "<anno ricavato dal testo, altrimenti lascia vuoto>"',
    'temi: [<solo id che esistono in temi.md>]',
    'generata: <data di oggi, aaaa-mm-gg>',
    '---',
    ...sezioni,
    '',
    'Regole:',
    '- Usa solo ciò che è nel testo e nelle annotazioni; se manca un\'informazione, annotala in note/lacune.md invece di indovinarla.',
    '- Le citazioni devono essere copiate parola per parola dal testo: l\'app controlla e segnala quelle che non ci sono.',
    '- La data la ricavi dal testo, mai la indovini: se non c\'è, lasciala vuota.',
    '- Temi e categorie: solo id già esistenti. Non cambiare id, non toccare stato/ né altri file.',
    '- Le parole chiave non si riscrivono: l\'app le ricava dalle annotazioni.',
    '- Non applicare nulla alla scheda: la conferma la do io dall\'app.',
    '',
    `Temi disponibili: ${m.temi.map((x) => x.id).join(', ') || '(nessuno)'}`,
    `Categorie disponibili: ${m.autore.corsie.map((c) => c.id).join(', ')}`
  ].join('\n')
}
