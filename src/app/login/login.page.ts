
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService, mensajeErrorGoogle } from '../auth.service';

import {
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  ToastController
} from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon
  ]
})
export class LoginPage {

  correo = '';
  contrasena = '';
  mostrarContrasena = false;
  readonly enviandoRecuperacion = signal(false);
  readonly googlePendiente = signal(false);
  readonly errorGoogle = signal('');

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  async iniciarSesion(): Promise<void> {
    if (
      !this.correo.trim() ||
      !this.contrasena
    ) {
      await this.mostrarToast('Debes llenar todos los campos.');
      return;
    }

    try {
      await this.authService.iniciarSesion(this.correo.trim(), this.contrasena);
      await this.router.navigate(['/paginaprincipal']);
    } catch (error) {
      console.error('Error al iniciar sesión.', error);
      await this.mostrarToast('No se pudo iniciar sesión. Revisa tu correo y contraseña.');
    }
  }

  async iniciarConGoogle(): Promise<void> {
    this.errorGoogle.set('');
    this.googlePendiente.set(true);
    try {
      await this.authService.iniciarConGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión con Google.', error);
      this.errorGoogle.set(mensajeErrorGoogle(error));
      await this.mostrarErrorGoogle(error);
    } finally {
      this.googlePendiente.set(false);
    }
  }

  async recuperarContrasena(): Promise<void> {
    const correo = this.correo.trim();
    if (!correo) {
      await this.mostrarToast('Escribe tu correo electrónico.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      await this.mostrarToast('Escribe un correo electrónico válido.');
      return;
    }

    this.enviandoRecuperacion.set(true);
    try {
      await this.authService.enviarRecuperacion(correo);
      await this.mostrarToast('Te enviamos un enlace para restablecer tu contraseña.');
    } catch (error) {
      console.error('Error al recuperar contraseña.', error);
      await this.mostrarToast('No se pudo enviar el enlace. Inténtalo nuevamente.');
    } finally {
      this.enviandoRecuperacion.set(false);
    }
  }

  private async mostrarErrorGoogle(error: unknown): Promise<void> {
    const codigo = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

    let mensaje = 'No se pudo iniciar sesión con Google. Inténtalo nuevamente.';

    if (
      codigo === 'auth/account-exists-with-different-credential' ||
      codigo === 'auth/email-already-in-use'
    ) {
      mensaje = 'Este correo ya está registrado con Google, selecciona "continuar con google" para iniciar sesion.';
    } else if (codigo === 'auth/popup-closed-by-user') {
      mensaje = 'El inicio de sesión con Google fue cancelado.';
    }

    await this.mostrarToast(mensaje);
  }

  private async mostrarToast(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 4000,
      position: 'middle',
      color: 'warning',
      cssClass: 'toast-google-error'
    });

    await toast.present();
  }
}
