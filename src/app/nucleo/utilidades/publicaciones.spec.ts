import { describe, expect, it } from 'vitest';
import type { Publicacion } from '../modelos/publicacion.model';
import { esCelularColombiano, limpiarCelular } from './telefono';
import { estadoPublicacion, tituloPublicacion } from './publicaciones';

const publicacion: Publicacion = {
  id: 'mascota-prueba', usuarioId: 'usuario-prueba', caso: 'hogar',
  creadaEn: '2026-01-01T00:00:00.000Z', fotos: [],
  datos: { especie: 'Perro', nombre: 'Coco', descripcion: 'Cariñoso y sociable.' }
};

describe('Datos de publicaciones', () => {
  it('limpia separadores y valida el formato de celular colombiano', () => {
    expect(limpiarCelular('300 123-4567')).toBe('3001234567');
    expect(esCelularColombiano(limpiarCelular('300 123-4567'))).toBe(true);
    expect(esCelularColombiano('2001234567')).toBe(false);
    expect(esCelularColombiano('300123456')).toBe(false);
  });

  it('muestra nombre y estado de adopción sin perder el caso original', () => {
    expect(tituloPublicacion(publicacion)).toBe('Coco');
    expect(estadoPublicacion({ ...publicacion, estado: 'adoptada' })).toBe('Adoptada');
    expect(tituloPublicacion({ ...publicacion, caso: 'encontrado', datos: { ...publicacion.datos, nombre: '' } }))
      .toBe('Perro encontrado');
  });
});
