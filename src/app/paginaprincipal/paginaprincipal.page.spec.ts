import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import type { FiltrosMascotas } from '../components/filtros/filtros.component';
import type { Publicacion } from '../services/publicaciones.service';
import { filtrarPublicaciones } from './paginaprincipal.page';

const publicaciones: Publicacion[] = [
  {
    id: 'gato',
    usuarioId: 'usuario-1',
    caso: 'hogar',
    creadaEn: '2026-01-01T00:00:00.000Z',
    fotos: [],
    datos: {
      especie: 'Gato',
      descripcion: 'Gato en adopción',
      edad: 'adulto',
      ciudad: 'Bogotá'
    }
  },
  {
    id: 'ave',
    usuarioId: 'usuario-2',
    caso: 'encontrado',
    creadaEn: '2026-01-02T00:00:00.000Z',
    fotos: [],
    datos: {
      especie: 'Loro',
      descripcion: 'Ave encontrada',
      edad: 'cachorro',
      lugarEncontrado: 'Parque Central'
    }
  },
  {
    id: 'perro',
    usuarioId: 'usuario-3',
    caso: 'hogar',
    creadaEn: '2026-01-03T00:00:00.000Z',
    fotos: [],
    datos: {
      especie: 'Perro',
      descripcion: 'Perro en adopción',
      edad: 6,
      ciudad: 'Medellín'
    }
  }
];

const filtrosVacios: FiltrosMascotas = {
  edad: '',
  ubicacion: '',
};

describe('filtrarPublicaciones', () => {
  it('combina edad y ubicación', () => {
    expect(filtrarPublicaciones(publicaciones, {
      edad: 'adulto',
      ubicacion: 'bogotá',
    }).map((publicacion) => publicacion.id)).toEqual(['gato']);
  });

  it('busca por el lugar del hallazgo', () => {
    expect(filtrarPublicaciones(publicaciones, {
      ...filtrosVacios,
      ubicacion: 'parque'
    }).map((publicacion) => publicacion.id)).toEqual(['ave']);
  });

  it('mantiene todas las publicaciones sin criterios y aplica el límite de edad numérica', () => {
    expect(filtrarPublicaciones(publicaciones, filtrosVacios)).toEqual(publicaciones);
    expect(filtrarPublicaciones(publicaciones, {
      ...filtrosVacios,
      edad: 'mayor'
    }).map((publicacion) => publicacion.id)).toEqual(['perro']);
  });
});
