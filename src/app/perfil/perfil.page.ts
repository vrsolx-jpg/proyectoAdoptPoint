import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cameraOutline, heartOutline, locationOutline, logOutOutline, pawOutline,
  personCircleOutline, settingsOutline } from 'ionicons/icons';
import { ConfirmarEliminacionService } from '../services/confirmar-eliminacion.service';
import { AuthService } from '../auth.service';
import { TarjetasMascotasComponent } from '../components/tarjetas-mascotas/tarjetas-mascotas.component';
import { comprimirImagen, LIMITE_FOTO_PERFIL } from '../services/imagenes';
import { EsqueletoComponent } from '../components/esqueleto/esqueleto.component';
import { CasoPublicacion, Publicacion, PublicacionesService, esCelularColombiano,
  estadoPublicacion, limpiarCelular, tituloPublicacion } from '../services/publicaciones.service';
import { UsuariosService } from '../services/usuarios.service';

interface Edicion {
  id: string;
  caso: CasoPublicacion;
  especie: string;
  nombre: string;
  descripcion: string;
  ciudad: string;
  telefono: string;
  lugarEncontrado: string;
  fechaEncontrado: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  imports: [FormsModule, IonContent, IonIcon, RouterLink, TarjetasMascotasComponent, EsqueletoComponent]
})
export class PerfilPage {
  readonly perfil = inject(UsuariosService);
  readonly publicacionesService = inject(PublicacionesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly eliminacion = inject(ConfirmarEliminacionService);
  readonly pestana = signal<'favoritos' | 'publicaciones'>('favoritos');
  readonly mensaje = signal('');
  readonly mensajeEdicion = signal('');
  readonly guardandoPerfil = signal(false);
  readonly guardandoPublicacion = signal(false);
  readonly confirmandoEliminacion = signal(false);
  readonly editando = signal<Edicion | null>(null);
  readonly publicaciones = computed(() => this.publicacionesService.publicaciones()
    .filter((publicacion) => publicacion.usuarioId === this.perfil.usuario()?.uid));
  readonly favoritas = computed(() => this.publicacionesService.publicaciones()
    .filter((publicacion) => this.perfil.favoritos().has(publicacion.id)));
  readonly adopciones = computed(() => this.publicaciones().filter(({ estado }) => estado === 'adoptada').length);
  readonly tituloPublicacion = tituloPublicacion;
  readonly estadoPublicacion = estadoPublicacion;

  readonly cerrandoSesion = signal(false);

  constructor() {
    addIcons({ arrowBackOutline, cameraOutline, heartOutline, locationOutline, logOutOutline,
      pawOutline, personCircleOutline, settingsOutline });
  }

  async seleccionarFoto(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    const uid = this.perfil.usuario()?.uid;
    entrada.value = '';
    if (!archivo || !uid || this.guardandoPerfil()) {
      return;
    }
    this.guardandoPerfil.set(true);
    this.mensaje.set('');
    try {
      const foto = await comprimirImagen(archivo, 512, LIMITE_FOTO_PERFIL);
      await this.perfil.guardarPerfil({ foto }, uid);
      this.mensaje.set('Actualizamos tu foto de perfil.');
    } catch {
      this.mensaje.set('No se pudo guardar la foto. Prueba con otra imagen.');
    } finally {
      this.guardandoPerfil.set(false);
    }
  }

  abrirFavorita(publicacion: Publicacion): void {
    void this.router.navigate(['/paginaprincipal'], { queryParams: { mascota: publicacion.id } });
  }

  editar(publicacion: Publicacion): void {
    const { id, caso, datos } = publicacion;
    this.mensajeEdicion.set('');
    this.editando.set({
      id, caso, especie: datos.especie, nombre: datos.nombre ?? '', descripcion: datos.descripcion,
      ciudad: datos.ciudad || this.perfil.ciudad() || '', telefono: datos.telefono || this.perfil.telefono(),
      lugarEncontrado: datos.lugarEncontrado ?? '', fechaEncontrado: datos.fechaEncontrado ?? ''
    });
  }

  async guardarPublicacion(edicion: Edicion): Promise<void> {
    const telefono = limpiarCelular(edicion.telefono);
    if (!esCelularColombiano(telefono)) {
      this.mensajeEdicion.set('Escribe un celular colombiano de 10 dígitos que empiece por 3.');
      return;
    }
    if (!edicion.especie.trim() || !edicion.descripcion.trim() || !edicion.ciudad.trim()
      || (edicion.caso === 'encontrado' && (!edicion.lugarEncontrado.trim() || !edicion.fechaEncontrado))) {
      this.mensajeEdicion.set('Completa la especie, descripción, ciudad y los datos del hallazgo cuando corresponda.');
      return;
    }
    await this.aplicarCambio(async () => {
      await this.publicacionesService.actualizarPublicacion(edicion.id, {
        caso: edicion.caso,
        ...(edicion.caso === 'encontrado' ? { estado: 'activa' as const } : {}),
        datos: { especie: edicion.especie.trim(), nombre: edicion.nombre.trim(),
          sinNombre: !edicion.nombre.trim(), descripcion: edicion.descripcion.trim(), ciudad: edicion.ciudad.trim(),
          telefono, lugarEncontrado: edicion.caso === 'encontrado' ? edicion.lugarEncontrado.trim() : '',
          fechaEncontrado: edicion.caso === 'encontrado' ? edicion.fechaEncontrado : '' }
      });
      this.editando.set(null);
    }, 'Publicación actualizada.');
  }

  async marcarAdoptada(publicacion: Publicacion): Promise<void> {
    await this.aplicarCambio(() => this.publicacionesService.actualizarPublicacion(publicacion.id, { estado: 'adoptada' }),
      'La mascota quedó marcada como adoptada.');
  }

  async confirmarEliminar(publicacion: Publicacion): Promise<void> {
    if (this.guardandoPublicacion() || this.confirmandoEliminacion()
      || publicacion.usuarioId !== this.perfil.usuario()?.uid) {
      return;
    }
    this.confirmandoEliminacion.set(true);
    try {
      if (await this.eliminacion.preguntar()) {
        await this.aplicarCambio(async () => {
          await this.publicacionesService.eliminarPublicacion(publicacion.id);
          if (this.editando()?.id === publicacion.id) {
            this.editando.set(null);
          }
        }, 'Publicación eliminada.');
      }
    } catch {
      this.mensajeEdicion.set('No pudimos abrir la confirmación. Inténtalo de nuevo.');
    } finally {
      this.confirmandoEliminacion.set(false);
    }
  }

  private async aplicarCambio(operacion: () => Promise<void>, confirmacion: string): Promise<void> {
    if (this.guardandoPublicacion()) {
      return;
    }
    this.guardandoPublicacion.set(true);
    this.mensajeEdicion.set('');
    try {
      await operacion();
      this.mensajeEdicion.set(confirmacion);
    } catch {
      this.mensajeEdicion.set('No se pudo actualizar la publicación. Inténtalo de nuevo.');
    } finally {
      this.guardandoPublicacion.set(false);
    }
  }

  async cerrarSesion(): Promise<void> {
    this.cerrandoSesion.set(true);
    try {
      await this.authService.cerrarSesion();
      await this.router.navigate(['/acceso']);
    } catch {
      this.mensaje.set('No se pudo cerrar sesión. Inténtalo nuevamente.');
    } finally {
      this.cerrandoSesion.set(false);
    }
  }

}
