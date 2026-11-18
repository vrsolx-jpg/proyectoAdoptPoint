import type { RangoEdad } from './publicacion.model';

export interface FiltrosMascotas {
  edad: RangoEdad | '';
  ubicacion: string;
}

export const FILTROS_VACIOS: FiltrosMascotas = { edad: '', ubicacion: '' };
