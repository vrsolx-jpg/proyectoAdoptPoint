import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { User } from 'firebase/auth';
import { AuthService } from '../auth.service';
import { FiltrosComponent } from '../components/filtros/filtros.component';
import type { FiltrosMascotas } from '../components/filtros/filtros.component';
import {
  Publicacion,
  PublicacionesService,
  RangoEdad
} from '../services/publicaciones.service';
import { TarjetasMascotasComponent } from '../components/tarjetas-mascotas/tarjetas-mascotas.component';
import {
  imageOutline,
  notificationsOutline,
  optionsOutline,
  pawOutline,
  homeOutline,
  personOutline,
  addOutline,
  personCircleOutline,
  closeOutline,
  locationOutline
} from 'ionicons/icons';

type Vista = 'historias' | 'dashboard';

interface Historia {
  nombre: string;
  tipo: string;
  imagen: string;
  alt: string;
}

interface Categoria {
  nombre: string;
  icono: string;
  seleccionada: boolean;
}

export function filtrarPublicaciones(
  publicaciones: Publicacion[],
  filtros: FiltrosMascotas
): Publicacion[] {
  return publicaciones.filter((publicacion) => {
    const datos = publicacion.datos;
    const especie = normalizarTexto(datos.especie);
    const especieCoincide = !filtros.especie
      || (filtros.especie === 'Otro'
        ? Boolean(especie) && !['perro', 'gato', 'ave'].includes(especie)
        : especie === normalizarTexto(filtros.especie));
    const ubicacion = normalizarTexto(
      [datos.ciudad, datos.lugarEncontrado].filter(Boolean).join(' ')
    );

    return especieCoincide
      && coincideEdad(datos.edad, filtros.edad)
      && (!filtros.tamanio
        || normalizarTexto(datos.tamanio ?? '') === normalizarTexto(filtros.tamanio))
      && (!filtros.sexo
        || normalizarTexto(datos.sexo ?? '') === normalizarTexto(filtros.sexo))
      && (!filtros.ubicacion || ubicacion.includes(normalizarTexto(filtros.ubicacion)));
  });
}

function coincideEdad(edad: Publicacion['datos']['edad'], filtro: FiltrosMascotas['edad']): boolean {
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
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

@Component({
  selector: 'app-paginaprincipal',
  templateUrl: './paginaprincipal.page.html',
  styleUrls: ['./paginaprincipal.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, FiltrosComponent,TarjetasMascotasComponent ]
})
export class PaginaPrincipalPage implements OnDestroy {
  vista: Vista = 'historias';
  historiaActual = 0;
  private readonly claveHistoriasVistas = 'adoptpoint:historias-vistas:';
  readonly usuario = signal<User | null>(null);
  readonly publicaciones = signal<Publicacion[]>([]);
  readonly errorPublicaciones = signal('');
  readonly filtrosAbiertos = signal(false);
  readonly criteriosFiltro = signal<FiltrosMascotas>({
    edad: '',
    tamanio: '',
    especie: '',
    ubicacion: '',
    sexo: ''
  });
  readonly hayFiltrosActivos = computed(() =>
    Object.values(this.criteriosFiltro()).some((criterio) => criterio.length > 0)
  );
  readonly publicacionesFiltradas = computed(() =>
    filtrarPublicaciones(this.publicaciones(), this.criteriosFiltro())
  );
  readonly publicacionSeleccionada = signal<Publicacion | null>(null);
  private readonly publicacionesService = inject(PublicacionesService);
  private detenerObservador: (() => void) | undefined;

  readonly historias: Historia[] = [
    { nombre: 'Coco', tipo: 'Perro', imagen: 'assets/img/perro.jpg', alt: 'Perro disponible para adopción' },
    { nombre: 'Fili', tipo: 'Gato', imagen: 'assets/img/fili.jpg', alt: 'Gato disponible para adopción' }
  ];

  readonly categorias: Categoria[] = [
    { nombre: 'Todos', icono: 'paw-outline', seleccionada: true },
    { nombre: 'Perros', icono: 'paw-outline', seleccionada: false },
    { nombre: 'Gatos', icono: 'paw-outline', seleccionada: false },
    { nombre: 'Aves', icono: 'paw-outline', seleccionada: false },
    { nombre: 'Otros', icono: 'paw-outline', seleccionada: false }
  ];

  constructor(private readonly authService: AuthService) {
    const usuarioActual = this.authService.obtenerUsuarioActual();
    this.usuario.set(usuarioActual);

    addIcons({
      imageOutline,
      notificationsOutline,
      optionsOutline,
      pawOutline,
      homeOutline,
      personOutline,
      addOutline,
      personCircleOutline,
      closeOutline,
      locationOutline
    });

    this.detenerObservador = this.authService.observarSesion((usuario) => {
      this.usuario.set(usuario);
      this.configurarVistaInicial(usuario);
    });
  }

  get nombreUsuario(): string {
    const usuario = this.usuario();
    const nombreRegistrado = this.authService.obtenerNombreRegistrado(usuario);
    const nombre = nombreRegistrado
      || usuario?.displayName?.trim()
      || 'Hola';

    return nombre.split(/\s+/)[0];
  }

  ngOnDestroy(): void {
    this.detenerObservador?.();
  }

  private configurarVistaInicial(usuario: User | null): void {
    if (!usuario) {
      return;
    }

    const clave = `${this.claveHistoriasVistas}${usuario.uid}`;
    if (localStorage.getItem(clave) === 'true') {
      this.vista = 'dashboard';
      return;
    }

    localStorage.setItem(clave, 'true');
  }

  tituloPublicacion(publicacion: Publicacion): string {
    if (publicacion.caso === 'encontrado') {
      return `${publicacion.datos.especie} encontrado`;
    }

    return publicacion.datos.nombre?.trim()
      || `${publicacion.datos.especie} sin nombre`;
  }

  detallePublicacion(publicacion: Publicacion): string {
    const datos = publicacion.datos;
    const detalle: string[] = [];

    if (publicacion.caso === 'hogar') {
      if (datos.raza) {
        detalle.push(datos.raza);
      }
      if (datos.edad !== undefined) {
        detalle.push(typeof datos.edad === 'number'
          ? `${datos.edad} ${datos.edad === 1 ? 'año' : 'años'}`
          : this.etiquetaRangoEdad(datos.edad));
      }
      if (datos.tamanio) {
        detalle.push(datos.tamanio);
      }
      if (datos.sexo) {
        detalle.push(datos.sexo);
      }
      if (datos.ciudad) {
        detalle.push(datos.ciudad);
      }
    } else {
      if (datos.edad) {
        detalle.push(typeof datos.edad === 'number'
          ? `${datos.edad} ${datos.edad === 1 ? 'año' : 'años'}`
          : this.etiquetaRangoEdad(datos.edad));
      }
      if (datos.tamanio) {
        detalle.push(datos.tamanio);
      }
      if (datos.lugarEncontrado) {
        detalle.push(datos.lugarEncontrado);
      }
    }

    return detalle.join(' · ') || datos.descripcion;
  }

  private etiquetaRangoEdad(rango: RangoEdad): string {
    const etiquetas: Record<RangoEdad, string> = {
      cachorro: 'Cachorro (0-2 años)',
      adulto: 'Adulto (2-6 años)',
      mayor: 'Mayor (6+ años)'
    };
    return etiquetas[rango];
  }
  estadoPublicacion(publicacion: Publicacion): string {
    return publicacion.caso === 'hogar'
      ? 'Disponible para adopción'
      : 'Animal encontrado';
  }

  abrirDetalle(publicacion: Publicacion): void {
    this.publicacionSeleccionada.set(publicacion);
  }

  cerrarDetalle(): void {
    this.publicacionSeleccionada.set(null);
  }

  publicadorPublicacion(publicacion: Publicacion): string {
    return publicacion.usuarioId === this.usuario()?.uid
      ? this.nombreUsuario
      : 'Usuario de AdoptPoint';
  }

  siguienteHistoria(): void {
    if (this.historiaActual < this.historias.length - 1) {
      this.historiaActual += 1;
      return;
    }
    this.vista = 'dashboard';
  }

  seleccionarCategoria(nombre: string): void {
    for (const categoria of this.categorias) {
      categoria.seleccionada = categoria.nombre === nombre;
    }
  }

  alternarFiltros(): void {
    this.filtrosAbiertos.update((abiertos) => !abiertos);
  }

  aplicarFiltros(filtros: FiltrosMascotas): void {
    this.criteriosFiltro.set({ ...filtros, ubicacion: filtros.ubicacion.trim() });
    this.filtrosAbiertos.set(false);
  }

  private cargarPublicaciones(): void {
    this.errorPublicaciones.set('');
    try {
      this.publicaciones.set(this.publicacionesService.listarPublicaciones());
    } catch (error) {
      console.error('No se pudieron cargar las publicaciones del dispositivo.', error);
      this.publicaciones.set([]);
      this.errorPublicaciones.set('No se pudieron cargar las publicaciones guardadas en este dispositivo.');
    }
  }
}