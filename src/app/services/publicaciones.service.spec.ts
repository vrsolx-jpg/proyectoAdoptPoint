import { beforeEach, describe, expect, it } from 'vitest';
import { PublicacionesService, Publicacion } from './publicaciones.service';

describe('PublicacionesService', () => {
  let service: PublicacionesService;

  beforeEach(() => {
    localStorage.clear();
    service = new PublicacionesService();
  });

  it('guarda las publicaciones nuevas en el feed local', () => {
    const publicacion = service.crearPublicacion('usuario-1', 'hogar', {
      especie: 'Perro',
      descripcion: 'Cariñoso y juguetón',
      nombre: 'Luna'
    }, []);

    expect(service.listarPublicaciones()).toEqual([publicacion]);
  });

  it('incluye publicaciones guardadas con la clave anterior por usuario', () => {
    const publicacion: Publicacion = {
      id: 'publicacion-anterior',
      usuarioId: 'usuario-1',
      caso: 'encontrado',
      creadaEn: '2026-11-15T12:00:00.000Z',
      fotos: [],
      datos: {
        especie: 'Gato',
        descripcion: 'Encontrado en el parque',
        lugarEncontrado: 'Parque central'
      }
    };
    localStorage.setItem(
      'adoptpoint:publicaciones:usuario-1',
      JSON.stringify([publicacion])
    );

    expect(service.listarPublicaciones()).toEqual([publicacion]);
  });

  it('reporta datos locales con formato inválido', () => {
    localStorage.setItem('adoptpoint:publicaciones:feed', '{invalid');

    expect(() => service.listarPublicaciones()).toThrow();
  });
});
