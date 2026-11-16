
import { Injectable } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  UserCredential,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { auth } from './firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly persistenceReady = setPersistence(auth, browserLocalPersistence);

  obtenerUsuarioActual(): User | null {
    return auth.currentUser;
  }

  async prepararSesion(): Promise<void> {
    await this.persistenceReady;
  }

  async registrar(email: string, password: string, nombre: string): Promise<UserCredential> {
    await this.persistenceReady;
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credencial.user, { displayName: nombre });
    this.guardarNombreRegistrado(email, nombre);
    return credencial;
  }

  guardarNombreRegistrado(email: string, nombre: string): void {
    if (!email.trim() || !nombre.trim()) {
      return;
    }

    localStorage.setItem(`adoptpoint:nombre:${email.trim().toLowerCase()}`, nombre.trim());
  }

  obtenerNombreRegistrado(user: User | null): string | null {
    if (!user?.email) {
      return null;
    }

    return localStorage.getItem(`adoptpoint:nombre:${user.email.trim().toLowerCase()}`);
  }

  iniciarSesion(email: string, password: string) {
    return this.persistenceReady.then(() =>
      signInWithEmailAndPassword(auth, email, password)
    );
  }

  iniciarConGoogle(): Promise<UserCredential> {
    const proveedor = new GoogleAuthProvider();
    proveedor.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, proveedor);
  }

  cerrarSesion() {
    return signOut(auth);
  }

  observarSesion(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}
