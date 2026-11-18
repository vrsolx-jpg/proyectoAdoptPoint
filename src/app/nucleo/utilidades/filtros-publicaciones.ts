import type { Publicacion } from '../modelos/publicacion.model';
import type { FiltrosMascotas } from '../modelos/filtros-mascotas.model';

export function filtrarPublicaciones(
  publicaciones: Publicacion[],
  filtros: FiltrosMascotas
): Publicacion[] {
  const buscada = normalizarUbicacion(filtros.ubicacion);
  return publicaciones.filter(({ datos }) => coincideEdad(datos.edad, filtros.edad)
    && (!buscada || [datos.ciudad, datos.lugarEncontrado].some((ubicacion) =>
      normalizarUbicacion(ubicacion ?? '').includes(buscada))));
}

function coincideEdad(
  edad: Publicacion['datos']['edad'],
  filtro: FiltrosMascotas['edad']
): boolean {
  if (!filtro) {
    return true;
  }

  if (typeof edad === 'number') {
    if (!Number.isFinite(edad) || edad < 0) {
      return false;
    }

    edad = edad < 2 ? 'cachorro' : edad < 6 ? 'adulto' : 'mayor';
  }

  return edad === filtro;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizarUbicacion(ubicacion: string): string {
  return normalizarTexto(ubicacion)
    .replace(/\bbogota(?: distrito capital| d\.?\s*c\.?)\b\.?/g, 'bogota')
    .replace(/\bsantiago de cali\b/g, 'cali');
}

