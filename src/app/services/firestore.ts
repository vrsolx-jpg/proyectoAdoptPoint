import { Injectable } from '@angular/core';
// Importa tu base de datos y las funciones de Firestore
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor() { }

  // Esta función es genérica: recibe el nombre de la colección y los datos a guardar
  async guardarDato(nombreColeccion: string, datos: any) {
    try {
      const docRef = await addDoc(collection(db, nombreColeccion), datos);
      console.log('¡Guardado exitoso en Firebase! ID:', docRef.id);
      return true; // Retorna true si tuvo éxito
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
      return false; // Retorna false si falló
    }
  }
}