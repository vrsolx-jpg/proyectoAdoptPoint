import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  checkmarkOutline,
  chevronForwardOutline,
  createOutline,
  imageOutline,
  locationOutline,
  lockClosedOutline,
  logOutOutline,
  pawOutline,
  personCircleOutline,
  settingsOutline
} from 'ionicons/icons';
import { auth } from '../firebase';
import { AuthService } from '../auth.service';

interface PerfilGuardado {
  direccion: string;
  foto: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink]
})
export class PerfilPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  nombre = auth.currentUser?.displayName || 'Usuario AdoptPoint';
  correo = auth.currentUser?.email || '';
  foto = auth.currentUser?.photoURL || '';
  direccion = '';
  nombreTemporal = this.nombre;
  direccionTemporal = '';
  readonly cantidadAdopciones = 0;
  readonly cantidadPublicaciones = 0;

  editandoNombre = false;
  guardandoNombre = false;
  mostrandoOpcionesFoto = false;
  mostrandoHistorial = false;
  mostrandoAjustes = false;
  editandoDireccion = false;
  editandoContrasena = false;
  solicitandoNuevaContrasena = false;
  verificandoContrasena = false;
  actualizandoContrasena = false;
  cerrandoSesion = false;
  contrasenaActual = '';
  contrasenaNueva = '';
  confirmarContrasenaNueva = '';
  mensajeEsExito = false;
  mensaje = '';

  private readonly clavePerfil = auth.currentUser
    ? `adoptpoint:perfil:${auth.currentUser.uid}`
    : '';

  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      checkmarkOutline,
      chevronForwardOutline,
      createOutline,
      imageOutline,
      locationOutline,
      lockClosedOutline,
      logOutOutline,
      pawOutline,
      personCircleOutline,
      settingsOutline
    });

    this.cargarPerfil();
  }

  async cerrarSesion(): Promise<void> {
    this.cerrandoSesion = true;
    this.mensaje = '';
    this.mensajeEsExito = false;

    try {
      await this.authService.cerrarSesion();
      await this.router.navigate(['/acceso']);
    } catch (error) {
      console.error('No se pudo cerrar la sesión.', error);
      this.mensaje = 'No se pudo cerrar sesión. Inténtalo nuevamente.';
    } finally {
      this.cerrandoSesion = false;
    }
  }

  async guardarNombre(): Promise<void> {
    const nombreLimpio = this.nombreTemporal.trim();
    const usuario = auth.currentUser;

    if (!nombreLimpio || nombreLimpio.length > 60) {
      this.mensaje = 'Escribe un nombre de hasta 60 caracteres.';
      return;
    }

    if (!usuario) {
      this.mensaje = 'Inicia sesión para modificar tu nombre.';
      return;
    }

    this.guardandoNombre = true;
    this.mensaje = '';
    this.mensajeEsExito = false;
    try {
      await updateProfile(usuario, { displayName: nombreLimpio });
      this.nombre = nombreLimpio;
      this.editandoNombre = false;
    } catch (error) {
      console.error('No se pudo actualizar el nombre del perfil.', error);
      this.mensaje = 'No se pudo guardar el nombre. Inténtalo nuevamente.';
    } finally {
      this.guardandoNombre = false;
    }
  }

  async seleccionarFoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    this.mensaje = '';
    this.mensajeEsExito = false;

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      this.mensaje = 'Selecciona un archivo de imagen.';
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      this.mensaje = 'La imagen debe pesar menos de 10 MB.';
      return;
    }

    try {
      this.foto = await this.prepararFoto(archivo);
      this.guardarPerfilLocal();
      this.mostrandoOpcionesFoto = false;
    } catch (error) {
      console.error('No se pudo procesar la foto del perfil.', error);
      this.mensaje = 'No se pudo guardar la foto. Inténtalo con otra imagen.';
    }
  }

  guardarDireccion(): void {
    this.direccion = this.direccionTemporal.trim();
    this.mensajeEsExito = false;
    this.guardarPerfilLocal();
    if (!this.mensaje) {
      this.editandoDireccion = false;
    }
  }

  alternarEdicionNombre(): void {
    this.editandoNombre = !this.editandoNombre;
    this.nombreTemporal = this.nombre;
    this.mensaje = '';
    this.mensajeEsExito = false;
  }

  alternarAjustes(): void {
    this.mostrandoAjustes = !this.mostrandoAjustes;
    this.mensaje = '';
    this.mensajeEsExito = false;

    if (!this.mostrandoAjustes) {
      this.editandoDireccion = false;
      this.editandoNombre = false;
      this.editandoContrasena = false;
      this.limpiarCambioContrasena();
    }
  }

  alternarEdicionDireccion(): void {
    this.editandoDireccion = !this.editandoDireccion;
    this.direccionTemporal = this.direccion;
    this.mensaje = '';
    this.mensajeEsExito = false;
  }

  alternarCambioContrasena(): void {
    this.editandoContrasena = !this.editandoContrasena;
    this.limpiarCambioContrasena();
    this.mensaje = '';
    this.mensajeEsExito = false;
  }

  async verificarContrasenaActual(): Promise<void> {
    const usuario = auth.currentUser;
    this.mensaje = '';
    this.mensajeEsExito = false;

    if (!this.contrasenaActual) {
      this.mensaje = 'Ingresa tu contraseña actual.';
      return;
    }

    if (!usuario?.email || !usuario.providerData.some(({ providerId }) => providerId === 'password')) {
      this.mensaje = 'El cambio de contraseña solo está disponible para cuentas con correo y contraseña.';
      return;
    }

    this.verificandoContrasena = true;
    try {
      const credencial = EmailAuthProvider.credential(usuario.email, this.contrasenaActual);
      await reauthenticateWithCredential(usuario, credencial);
      this.contrasenaActual = '';
      this.solicitandoNuevaContrasena = true;
    } catch (error) {
      console.error('No se pudo verificar la contraseña actual.', error);
      const codigo = this.codigoErrorFirebase(error);
      this.mensaje = codigo === 'auth/invalid-credential'
        || codigo === 'auth/invalid-login-credentials'
        || codigo === 'auth/wrong-password'
        ? 'La contraseña actual no es correcta.'
        : 'No se pudo verificar tu contraseña. Inténtalo nuevamente.';
    } finally {
      this.verificandoContrasena = false;
    }
  }

  async guardarNuevaContrasena(): Promise<void> {
    const requisitos = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,64}$/;
    this.mensaje = '';
    this.mensajeEsExito = false;

    if (!requisitos.test(this.contrasenaNueva)) {
      this.mensaje = 'Usa entre 8 y 64 caracteres, con mayúscula, minúscula, número y símbolo.';
      return;
    }

    if (this.contrasenaNueva !== this.confirmarContrasenaNueva) {
      this.mensaje = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    const usuario = auth.currentUser;
    if (!usuario) {
      this.mensaje = 'Inicia sesión para cambiar tu contraseña.';
      return;
    }

    this.actualizandoContrasena = true;
    try {
      await updatePassword(usuario, this.contrasenaNueva);
      this.limpiarCambioContrasena();
      this.editandoContrasena = false;
      this.mensaje = 'Tu contraseña se actualizó correctamente.';
      this.mensajeEsExito = true;
    } catch (error) {
      console.error('No se pudo actualizar la contraseña.', error);
      const codigo = this.codigoErrorFirebase(error);
      this.mensaje = codigo === 'auth/requires-recent-login'
        ? 'Por seguridad, verifica nuevamente tu contraseña actual e inténtalo otra vez.'
        : codigo === 'auth/weak-password'
          ? 'La contraseña nueva no cumple los requisitos de seguridad.'
          : 'No se pudo cambiar la contraseña. Inténtalo nuevamente.';
      if (codigo === 'auth/requires-recent-login') {
        this.solicitandoNuevaContrasena = false;
      }
    } finally {
      this.actualizandoContrasena = false;
    }
  }

  private limpiarCambioContrasena(): void {
    this.solicitandoNuevaContrasena = false;
    this.contrasenaActual = '';
    this.contrasenaNueva = '';
    this.confirmarContrasenaNueva = '';
  }

  private codigoErrorFirebase(error: unknown): string {
    return error instanceof Error && 'code' in error
      ? String((error as Error & { code?: string }).code)
      : '';
  }

  actualizarNombre(event: Event): void {
    this.nombreTemporal = (event.target as HTMLInputElement).value;
  }

  actualizarDireccion(event: Event): void {
    this.direccionTemporal = (event.target as HTMLInputElement).value;
  }

  actualizarCampoContrasena(campo: 'actual' | 'nueva' | 'confirmacion', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    if (campo === 'actual') {
      this.contrasenaActual = valor;
    } else if (campo === 'nueva') {
      this.contrasenaNueva = valor;
    } else {
      this.confirmarContrasenaNueva = valor;
    }
  }

  private cargarPerfil(): void {
    if (!this.clavePerfil) {
      return;
    }

    try {
      const datos = localStorage.getItem(this.clavePerfil);
      if (!datos) {
        return;
      }

      const perfil = JSON.parse(datos) as Partial<PerfilGuardado>;
      this.direccion = typeof perfil.direccion === 'string' ? perfil.direccion : '';
      this.direccionTemporal = this.direccion;
      this.foto = typeof perfil.foto === 'string' && perfil.foto
        ? perfil.foto
        : this.foto;
    } catch (error) {
      console.error('No se pudo cargar el perfil guardado.', error);
      this.mensaje = 'No se pudieron cargar algunos datos del perfil.';
    }
  }

  private guardarPerfilLocal(): void {
    if (!this.clavePerfil) {
      this.mensaje = 'Inicia sesión para guardar los datos de tu perfil.';
      return;
    }

    try {
      localStorage.setItem(this.clavePerfil, JSON.stringify({
        direccion: this.direccion,
        foto: this.foto
      } satisfies PerfilGuardado));
      this.mensaje = '';
    } catch (error) {
      console.error('No se pudieron guardar los datos del perfil.', error);
      this.mensajeEsExito = false;
      this.mensaje = 'No se pudieron guardar los cambios en este dispositivo.';
    }
  }

  private async prepararFoto(archivo: File): Promise<string> {
    const origen = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('La imagen no se pudo leer.'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Error al leer la imagen.'));
      reader.readAsDataURL(archivo);
    });

    const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => resolve(elemento);
      elemento.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'));
      elemento.src = origen;
    });

    const escala = Math.min(1, 512 / Math.max(imagen.width, imagen.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(imagen.width * escala));
    canvas.height = Math.max(1, Math.round(imagen.height * escala));

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      throw new Error('No se pudo preparar la imagen.');
    }

    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }
}
