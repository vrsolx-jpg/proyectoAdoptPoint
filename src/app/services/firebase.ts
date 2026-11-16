import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  
  // AQUÍ VA TU URL EXACTA
  // Nota cómo termina en /usuarios.json para crear esa colección en tu base de datos
  private url = 'https://adoptpoint-default-rtdb.firebaseio.com/usuarios.json';

  constructor(private http: HttpClient) { }

  // Esta función envía la información a la URL de arriba
  guardarDatos(datos: any) {
    this.http.post(this.url, datos).subscribe({
      next: (respuesta) => console.log('¡Guardado exitoso en Firebase!', respuesta),
      error: (error) => console.error('Hubo un error', error)
    });
  }
}