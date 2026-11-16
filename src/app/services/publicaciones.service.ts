import { Injectable } from '@angular/core';

export type CasoPublicacion = 'hogar' | 'encontrado';

export interface DatosPublicacion {
  especie: string;
  descripcion: string;
  nombre?: string;
  sinNombre?: boolean;
  raza?: string;
  edad?: number;
  tamanio?: string;
  esterilizado?: boolean | null;
  sexo?: string;
  vacunado?: boolean | null;
  desparasitado?: boolean | null;
  peso?: number | null;
  color?: string;
  ciudad?: string;
  compatibleNinos?: boolean | null;
  compatibleMascotas?: boolean | null;
  entrenadoCasa?: boolean | null;
  veterinario?: string;
  ultimaVisita?: string;
  proximaCita?: string;
  lugarEncontrado?: string;
  fechaEncontrado?: string;
}

export interface Publicacion {
  id: string;
  usuarioId: string;
  caso: CasoPublicacion;
  creadaEn: string;
  fotos: string[];
  datos: DatosPublicacion;
}

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly claveFeed = 'adoptpoint:publicaciones:feed';
  private readonly prefijoPublicacionesUsuario = 'adoptpoint:publicaciones:';

  listarPublicaciones(): Publicacion[] {
    const publicaciones = new Map<string, Publicacion>();
    this.leerLista(this.claveFeed).forEach((publicacion) => {
      publicaciones.set(publicacion.id, publicacion);
    });

    for (let indice = 0; indice < localStorage.length; indice += 1) {
      const clave = localStorage.key(indice);
      if (!clave || clave === this.claveFeed
        || !clave.startsWith(this.prefijoPublicacionesUsuario)) {
        continue;
      }

      this.leerLista(clave).forEach((publicacion) => {
        if (!publicaciones.has(publicacion.id)) {
          publicaciones.set(publicacion.id, publicacion);
        }
      });
    }

    return [...publicaciones.values()]
      .sort((a, b) => Date.parse(b.creadaEn) - Date.parse(a.creadaEn));
  }

  crearPublicacion(
    usuarioId: string,
    caso: CasoPublicacion,
    datos: DatosPublicacion,
    fotos: string[]
  ): Publicacion {
    if (!usuarioId.trim()) {
      throw new Error('Se requiere una sesión para publicar.');
    }

    const publicaciones = this.leerLista(this.claveFeed);
    const publicacion: Publicacion = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      usuarioId,
      caso,
      creadaEn: new Date().toISOString(),
      fotos: [...fotos],
      datos
    };

    localStorage.setItem(this.claveFeed, JSON.stringify([...publicaciones, publicacion]));
    return publicacion;
  }

  private leerLista(clave: string): Publicacion[] {
    const contenido = localStorage.getItem(clave);
    if (!contenido) {
      return [];
    }

    const guardado: unknown = JSON.parse(contenido);
    if (!Array.isArray(guardado) || !guardado.every((item) => this.esPublicacion(item))) {
      throw new Error(`Las publicaciones guardadas en "${clave}" no tienen un formato válido.`);
    }

    return guardado;
  }

  private esPublicacion(valor: unknown): valor is Publicacion {
    if (typeof valor !== 'object' || valor === null) {
      return false;
    }

    const publicacion = valor as Partial<Publicacion>;
    const datos = publicacion.datos;
    return typeof publicacion.id === 'string'
      && typeof publicacion.usuarioId === 'string'
      && (publicacion.caso === 'hogar' || publicacion.caso === 'encontrado')
      && typeof publicacion.creadaEn === 'string'
      && Array.isArray(publicacion.fotos)
      && publicacion.fotos.every((foto) => typeof foto === 'string')
      && typeof datos === 'object'
      && datos !== null
      && typeof datos.especie === 'string'
      && typeof datos.descripcion === 'string';
  }
}
