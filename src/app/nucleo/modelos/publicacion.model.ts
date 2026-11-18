export type CasoPublicacion = 'hogar' | 'encontrado';
export type RangoEdad = 'cachorro' | 'adulto' | 'mayor';

export interface DatosPublicacion {
  especie: string;
  descripcion: string;
  nombre?: string;
  sinNombre?: boolean;
  raza?: string;
  edad?: number | RangoEdad;
  tamanio?: string;
  esterilizado?: boolean | null;
  sexo?: string;
  vacunado?: boolean | null;
  desparasitado?: boolean | null;
  peso?: number | null;
  color?: string;
  ciudad?: string;
  telefono?: string;
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
  publicador?: string;
  estado?: 'activa' | 'adoptada';
  demostracion?: boolean;
  creditoFoto?: { autor: string; licencia: string; enlaceLicencia?: string; fuente: string };
  datos: DatosPublicacion;
}
