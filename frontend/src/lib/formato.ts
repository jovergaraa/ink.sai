// Formateo compartido entre /agendar y /mis-reservas. Vive aparte porque las
// dos páginas tienen que mostrar la misma fecha con las mismas palabras: si se
// duplica, una termina diciendo "30-09-2026" y la otra "miércoles 30".

export function fmtMonto(n: number) {
  return n === 0 ? 'Gratis' : '$' + n.toLocaleString('es-CL');
}

export function fmtDuracion(min: number) {
  const h = Math.floor(min / 60);
  const r = min % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

export function fmtFecha(iso: string) {
  // Partido a mano: new Date('2026-09-30') se interpreta como UTC y en Chile
  // devuelve el día anterior.
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function fmtHora(hhmmss: string) {
  return hhmmss.slice(0, 5);
}

/** Fecha de hoy en 'YYYY-MM-DD' local, no UTC. */
export function hoyIso() {
  return new Date().toLocaleDateString('sv-SE');
}

/** Días completos entre hoy y una fecha 'YYYY-MM-DD'. Negativo si ya pasó. */
export function diasHasta(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  const objetivo = new Date(a, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);
}
