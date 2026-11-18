import type { Publicacion } from '../modelos/publicacion.model';

export function tituloPublicacion(publicacion: Publicacion): string {
  return publicacion.datos.nombre?.trim() || (publicacion.caso === 'encontrado'
    ? publicacion.datos.especie + ' encontrado' : publicacion.datos.especie + ' sin nombre');
}

export function estadoPublicacion(publicacion: Publicacion): string {
  if (publicacion.estado === 'adoptada') {
    return 'Adoptada';
  }
  return publicacion.caso === 'hogar' ? 'Busca un nuevo hogar' : publicacion.datos.especie + ' encontrado';
}

export function nombrePublicador(publicacion: Publicacion): string {
  const nombre = publicacion.publicador?.trim();
  return nombre && nombre !== 'Usuario de AdoptPoint' ? nombre : 'Nombre sin indicar';
}
