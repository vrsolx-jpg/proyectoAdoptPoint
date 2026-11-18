export function limpiarCelular(telefono: string): string {
  return telefono.replace(/\D/g, '');
}

export function esCelularColombiano(numero: string): boolean {
  return /^3\d{9}$/.test(numero);
}

export function numeroWhatsApp(telefono: string | undefined): string | null {
  const limpio = typeof telefono === 'string' ? limpiarCelular(telefono) : '';
  if (esCelularColombiano(limpio)) {
    return '57' + limpio;
  }
  return /^573\d{9}$/.test(limpio) ? limpio : null;
}
