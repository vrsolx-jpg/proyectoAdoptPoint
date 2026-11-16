
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
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  async registrar(email: string, password: string, nombre: string): Promise<UserCredential> {
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credencial.user, { displayName: nombre });
    return credencial;
  }

  iniciarSesion(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  iniciarConGoogle(): Promise<UserCredential> {
    return signInWithPopup(auth, new GoogleAuthProvider());
  }

  cerrarSesion() {
    return signOut(auth);
  }

  observarSesion(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}
