import { Component, inject, OnDestroy, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { User } from 'firebase/auth';
import { AuthService } from '../auth.service';
import { Publicacion, PublicacionesService } from '../services/publicaciones.service';
import {
  heartOutline,
  imageOutline,
  notificationsOutline,
  optionsOutline,
  pawOutline,
  searchOutline,
  homeOutline,
  personOutline,
  addOutline,
  personCircleOutline
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
  imports: [IonContent, IonIcon, RouterLink]
})
export class PaginaPrincipalPage implements OnDestroy {
  vista: Vista = 'historias';
  historiaActual = 0;
  readonly usuario = signal<User | null>(null);
  readonly publicaciones = signal<Publicacion[]>([]);
  readonly errorPublicaciones = signal('');
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
      heartOutline,
      imageOutline,
      notificationsOutline,
      optionsOutline,
      pawOutline,
      searchOutline,
      homeOutline,
      personOutline,
      addOutline,
      personCircleOutline
    });

    this.detenerObservador = this.authService.observarSesion((usuario) => {
      this.usuario.set(usuario);
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
        detalle.push(`${datos.edad} ${datos.edad === 1 ? 'año' : 'años'}`);
      }
      if (datos.ciudad) {
        detalle.push(datos.ciudad);
      }
    } else {
      if (datos.lugarEncontrado) {
        detalle.push(datos.lugarEncontrado);
      }
      if (datos.fechaEncontrado) {
        detalle.push(datos.fechaEncontrado);
      }
    }

    return detalle.join(' · ') || datos.descripcion;
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