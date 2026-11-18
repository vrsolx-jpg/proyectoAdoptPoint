import { describe, expect, it } from 'vitest';
import { esCelularColombiano, estadoPublicacion, limpiarCelular, tituloPublicacion } from './publicaciones.service';
import { publicacionesDemo } from './publicaciones-demo';

describe('Publicaciones', () => {
  it('limpia separadores y valida el formato de celular colombiano', () => {
    expect(limpiarCelular('300 123-4567')).toBe('3001234567');
    expect(esCelularColombiano(limpiarCelular('300 123-4567'))).toBe(true);
    expect(esCelularColombiano('2001234567')).toBe(false);
    expect(esCelularColombiano('300123456')).toBe(false);
  });

  it('muestra nombre y estado de adopción sin perder el caso original', () => {
    const publicacion = publicacionesDemo[0];
    expect(tituloPublicacion(publicacion)).toBe('Coco');
    expect(estadoPublicacion({ ...publicacion, estado: 'adoptada' })).toBe('Adoptada');
    expect(tituloPublicacion({ ...publicacion, caso: 'encontrado', datos: { ...publicacion.datos, nombre: '' } }))
      .toBe('Perro encontrado');
  });

  it('identifica las publicaciones de demostración con IDs estables', () => {
    expect(new Set(publicacionesDemo.map(({ id }) => id)).size).toBe(publicacionesDemo.length);
    expect(publicacionesDemo.every(({ demostracion, fotos }) => demostracion && fotos.length > 0)).toBe(true);
  });
});
