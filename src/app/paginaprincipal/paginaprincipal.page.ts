import { Component, inject, OnDestroy, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { User } from 'firebase/auth';
import { AuthService } from '../auth.service';
import { Publicacion, PublicacionesService } from '../services/publicaciones.service';
import { TarjetasMascotasComponent } from '../components/tarjetas-mascotas/tarjetas-mascotas.component';
import {
  imageOutline,
  notificationsOutline,
  optionsOutline,
  pawOutline,
  searchOutline,
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

@Component({
  selector: 'app-paginaprincipal',
  templateUrl: './paginaprincipal.page.html',
  styleUrls: ['./paginaprincipal.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, TarjetasMascotasComponent]
})
export class PaginaPrincipalPage implements OnDestroy {
  vista: Vista = 'historias';
  historiaActual = 0;
  private readonly claveHistoriasVistas = 'adoptpoint:historias-vistas:';
  readonly usuario = signal<User | null>(null);
  readonly publicaciones = signal<Publicacion[]>([]);
  readonly errorPublicaciones = signal('');
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
      searchOutline,
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
    this.cargarPublicaciones();
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

  ionViewWillEnter(): void {
    this.cargarPublicaciones();
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
      if (datos.ciudad) {
        detalle.push(datos.ciudad);
      }
    } else {
      if (datos.lugarEncontrado) {
        detalle.push(datos.lugarEncontrado);
      }
    }

    return detalle.join(' · ') || datos.descripcion;
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