import type { CSSProperties, ReactNode } from 'react'

/** Icone a tratto (24×24), tutte nello stesso stile: niente simboli di testo, niente emoji. */
const D = {
  chiudi: ['M18 6 6 18', 'm6 6 12 12'],
  indietro: ['m12 19-7-7 7-7', 'M19 12H5'],
  avanti: ['M5 12h14', 'm12 5 7 7-7 7'],
  su: ['m5 12 7-7 7 7', 'M12 19V5'],
  giu: ['M12 5v14', 'm19 12-7 7-7-7'],
  sx: ['m15 18-6-6 6-6'],
  dx: ['m9 18 6-6-6-6'],
  apri: ['m6 9 6 6 6-6'],
  chiuso: ['m18 15-6-6-6 6'],
  allarga: ['m18 8 4 4-4 4', 'M2 12h20', 'm6 8-4 4 4 4'],
  riduci: ['m20 17-5-5 5-5', 'm4 17 5-5-5-5'],
  matita: ['M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z', 'm15 5 4 4'],
  esterno: ['M7 7h10v10', 'M7 17 17 7'],
  menu: ['M4 12h16', 'M4 6h16', 'M4 18h16'],
  sole: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
  luna: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  aiuto: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01'],
  testo: ['M4 7V4h16v3', 'M9 20h6', 'M12 4v16'],
  piu: ['M5 12h14', 'M12 5v14'],
  meno: ['M5 12h14'],
  cerca: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'm21 21-4.3-4.3'],
  spunta: ['M20 6 9 17l-5-5'],
  cestino: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11v6', 'M14 11v6'],
  numeri: ['M4 9h16', 'M4 15h16', 'M10 3 8 21', 'M16 3l-2 18'],
  evidenzia: ['m9 11-6 6v3h9l3-3', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'],
  sottolinea: ['M6 4v6a6 6 0 0 0 12 0V4', 'M4 20h16'],
  stella: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  carte: ['M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z', 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
  parafrasi: ['M13 4v16', 'M17 4v16', 'M19 4H9.5a4.5 4.5 0 0 0 0 9H13'],
  figura: ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'],
  domanda: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 'M9.5 8.5a2.5 2.5 0 0 1 4.9.7c0 1.5-2.4 2-2.4 3', 'M12 15h.01'],
  gioca: ['M6 3 20 12 6 21Z'],
  pausa: ['M14 4h4v16h-4z', 'M6 4h4v16H6z'],
  mappa: ['M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z', 'M15 5.764v15', 'M9 3.236v15'],
  elenco: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  libro: ['M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'],
  scudo: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'],
  regolazioni: ['M21 4h-7', 'M10 4H3', 'M21 12h-9', 'M8 12H3', 'M21 20h-5', 'M12 20H3', 'M14 2v4', 'M8 10v4', 'M16 18v4'],
  orologio: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6v6l4 2'],
  file: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8'],
  incolla: ['M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'],
  tastiera: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M6 8h.01', 'M10 8h.01', 'M14 8h.01', 'M18 8h.01', 'M8 12h.01', 'M12 12h.01', 'M16 12h.01', 'M7 16h10'],
  forbici: ['M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M20 4 8.12 15.88', 'M14.47 14.48 20 20', 'M8.12 8.12 12 12'],
  unisci: ['m8 6 4-4 4 4', 'M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22', 'm20 22-5-5'],
  collega: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  scollega: ['m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'm5.17 11.75-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71', 'M2 2l20 20'],
  mirino: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M22 12h-4', 'M6 12H2', 'M12 6V2', 'M12 22v-4'],
  avviso: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  versi: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  prosa: ['M3 6h18', 'M3 12h18', 'M3 18h12'],
  griglia: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  casa: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  aggiungiScheda: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M9 15h6', 'M12 12v6'],
  duplica: ['M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z', 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
  cartella: ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z'],
  segnalibro: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z']
} as const

export type NomeIcona = keyof typeof D

export function Icona(props: { nome: NomeIcona; size?: number; style?: CSSProperties; piena?: boolean }) {
  const s = props.size ?? 16
  return (
    <svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill={props.piena ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', display: 'block', ...props.style }}>
      {D[props.nome].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

/** Icona + testo affiancati dentro un pulsante. */
export function Con(props: { i: NomeIcona; children?: ReactNode; size?: number; fine?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
      {!props.fine && <Icona nome={props.i} size={props.size ?? 15} />}
      {props.children}
      {props.fine && <Icona nome={props.i} size={props.size ?? 15} />}
    </span>
  )
}
