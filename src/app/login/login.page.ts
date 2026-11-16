
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../auth.service';

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
    CommonModule,
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

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toastController: ToastController
  ) {
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
    try {
      await this.authService.iniciarConGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión con Google.', error);
      await this.mostrarErrorGoogle(error);
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
