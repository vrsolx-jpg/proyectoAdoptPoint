import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { addIcons } from 'ionicons';
import { arrowBackOutline, locationOutline } from 'ionicons/icons';
import { UbicacionService } from '../../nucleo/servicios/ubicacion.service';
import { AuthService, codigoErrorAuth } from '../../nucleo/servicios/auth.service';
import { esCelularColombiano, limpiarCelular } from '../../nucleo/utilidades/telefono';
import { EsqueletoComponent } from '../../compartido/componentes/esqueleto/esqueleto.component';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';

interface DatosCuenta {
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
}

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrl: './ajustes.page.scss',
  imports: [FormsModule, RouterLink, IonContent, IonIcon, EsqueletoComponent]
})
export class AjustesPage {
  readonly perfil = inject(UsuariosService);
  readonly ubicacion = inject(UbicacionService);
  private readonly auth = inject(AuthService);
  readonly borrador = linkedSignal<DatosCuenta & { uid: string | undefined }, DatosCuenta>({
    source: () => ({
      uid: this.perfil.usuario()?.uid,
      nombre: this.perfil.nombre(), ciudad: this.perfil.ciudad() ?? '',
      direccion: this.perfil.direccion(), telefono: this.perfil.telefono()
    }),
    computation: (actual, anterior) => {
      const { uid, ...datos } = actual;
      if (!anterior || anterior.source.uid !== uid) {
        return datos;
      }
      for (const campo of ['nombre', 'ciudad', 'direccion', 'telefono'] as const) {
        if (anterior.value[campo] !== anterior.source[campo]) {
          datos[campo] = anterior.value[campo];
        }
      }
      return datos;
    }
  });
  readonly correo = computed(() => this.perfil.usuario()?.email ?? '');
  readonly cuentaConContrasena = computed(() =>
    this.perfil.usuario()?.providerData.some(({ providerId }) => providerId === 'password') ?? false);
  readonly guardando = signal(false);
  readonly cambiando = signal(false);
  readonly enviando = signal(false);
  readonly mensajePerfil = signal('');
  readonly mensajeSeguridad = signal('');
  actual = '';
  nueva = '';
  confirmacion = '';

  constructor() {
    addIcons({ arrowBackOutline, locationOutline });
  }

  async usarUbicacion(): Promise<void> {
    try {
      const ciudad = await this.ubicacion.usarUbicacionActual();
      this.borrador.update((datos) => ({ ...datos, ciudad }));
    } catch {
      // La explicación aparece junto al botón para volver a intentarlo.
    }
  }

  async guardar(): Promise<void> {
    const { nombre, ciudad, direccion, telefono } = this.borrador();
    const numero = limpiarCelular(telefono).replace(/^57(?=3\d{9}$)/, '');
    if (!nombre.trim() || (telefono.trim() && !esCelularColombiano(numero))) {
      this.mensajePerfil.set('Escribe tu nombre y, si agregas un celular, usa un número colombiano de 10 dígitos.');
      return;
    }
    this.guardando.set(true);
    this.mensajePerfil.set('');
    try {
      await this.perfil.guardarPerfil({
        nombre: nombre.trim(), ciudad: ciudad.trim(), direccion: direccion.trim(),
        ...(numero || this.perfil.telefono() ? { telefono: numero } : {})
      });
      this.mensajePerfil.set('Guardamos tus datos.');
    } catch {
      this.mensajePerfil.set('No se pudieron guardar tus datos. Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  async cambiarContrasena(): Promise<void> {
    const usuario = this.perfil.usuario();
    const correo = this.correo();
    if (!usuario || !correo || !this.cuentaConContrasena()) {
      return;
    }
    if (!this.actual || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,64}$/.test(this.nueva)
      || this.nueva !== this.confirmacion) {
      this.mensajeSeguridad.set('Revisa los requisitos de la nueva contraseña y confirma que coincida.');
      return;
    }
    this.cambiando.set(true);
    this.mensajeSeguridad.set('');
    try {
      await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(correo, this.actual));
      await updatePassword(usuario, this.nueva);
      this.actual = '';
      this.nueva = '';
      this.confirmacion = '';
      this.mensajeSeguridad.set('Actualizamos tu contraseña.');
    } catch (error) {
      const codigo = codigoErrorAuth(error);
      this.mensajeSeguridad.set(['auth/invalid-credential', 'auth/wrong-password'].includes(codigo)
        ? 'La contraseña actual no es correcta. Puedes recuperarla por correo.'
        : 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
    } finally {
      this.cambiando.set(false);
    }
  }

  async recuperarContrasena(): Promise<void> {
    this.enviando.set(true);
    this.mensajeSeguridad.set('');
    try {
      await this.auth.enviarRecuperacion(this.correo());
      this.mensajeSeguridad.set('Te enviamos un enlace para restablecer tu contraseña. Revisa también el correo no deseado.');
    } catch {
      this.mensajeSeguridad.set('No se pudo enviar el enlace. Inténtalo de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }
}
