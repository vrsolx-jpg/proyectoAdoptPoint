import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  addOutline,
  cameraOutline,
  checkmarkOutline,
  closeOutline,
  heartOutline,
  homeOutline,
  locationOutline,
  pawOutline,
  trashOutline
} from 'ionicons/icons';
import { auth } from '../firebase';
import {
  CasoPublicacion,
  DatosPublicacion,
  PublicacionesService
} from '../services/publicaciones.service';

type Respuesta = boolean | null;
type Especie = 'Perro' | 'Gato' | 'Ave' | 'Otro' | '';

interface FotoPublicacion {
  id: number;
  datos: string;
}

@Component({
  selector: 'app-publicar',
  templateUrl: './publicar.page.html',
  styleUrls: ['./publicar.page.scss'],
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, RouterLink]
})
export class PublicarPage {
  private readonly router = inject(Router);
  private readonly publicacionesService = inject(PublicacionesService);

  caso: CasoPublicacion | null = null;
  fotos: FotoPublicacion[] = [];
  mensaje = '';
  mensajeEsExito = false;
  guardando = false;
  fotoParaRecortar = '';
  zoomRecorte = 1;
  posicionXRecorte = 0;
  posicionYRecorte = 0;
  private imagenRecorte: HTMLImageElement | null = null;
  recorteCargando = false;

  nombre = '';
  sinNombre = false;
  raza = '';
  edad = '';
  tamanio = '';
  descripcion = '';
  esterilizado: Respuesta = null;
  sexo = '';
  vacunado: Respuesta = null;
  desparasitado: Respuesta = null;
  peso = '';
  color = '';
  ciudad = '';
  compatibleNinos: Respuesta = null;
  compatibleMascotas: Respuesta = null;
  entrenadoCasa: Respuesta = null;
  veterinario = '';
  ultimaVisita = '';
  proximaCita = '';

  especieCasa: Especie = '';
  otraEspecieCasa = '';
  especieEncontrada: Especie = '';
  otraEspecie = '';
  lugarEncontrado = '';
  fechaEncontrado = '';
  descripcionEncontrado = '';

  readonly tamanos = ['Pequeño', 'Mediano', 'Grande'];
  readonly especies = ['Perro', 'Gato', 'Ave', 'Otro'] as const;
  readonly espaciosFotos = [0, 1, 2];
  private siguienteIdFoto = 0;

  constructor() {
    addIcons({
      arrowBackOutline,
      addOutline,
      cameraOutline,
      checkmarkOutline,
      closeOutline,
      heartOutline,
      homeOutline,
      locationOutline,
      pawOutline,
      trashOutline
    });
  }

  seleccionarCaso(caso: CasoPublicacion): void {
    this.caso = caso;
    this.mensaje = '';
    this.mensajeEsExito = false;
  }

  alternarSinNombre(): void {
    this.sinNombre = !this.sinNombre;
    if (this.sinNombre) {
      this.nombre = '';
    }
  }

  async seleccionarFotos(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivos = Array.from(input.files || []);
    input.value = '';
    this.mensaje = '';
    this.mensajeEsExito = false;

    for (const archivo of archivos) {
      if (this.fotos.length >= 3) {
        this.mensaje = 'Puedes agregar hasta 3 fotos.';
        break;
      }

      if (!archivo.type.startsWith('image/')) {
        this.mensaje = 'Solo puedes agregar archivos de imagen.';
        continue;
      }

      if (archivo.size > 8 * 1024 * 1024) {
        this.mensaje = 'Cada foto debe pesar menos de 8 MB.';
        continue;
      }

      try {
        await this.abrirEditorRecorte(archivo);
      } catch (error) {
        console.error('No se pudo cargar una foto para la publicación.', error);
        this.mensaje = 'No se pudo procesar una de las fotos seleccionadas.';
      }

    }
  }

  actualizarZoom(event: Event): void {
    this.zoomRecorte = Number((event.target as HTMLInputElement).value);
  }

  actualizarPosicionX(event: Event): void {
    this.posicionXRecorte = Number((event.target as HTMLInputElement).value);
  }

  actualizarPosicionY(event: Event): void {
    this.posicionYRecorte = Number((event.target as HTMLInputElement).value);
  }

  cancelarRecorte(): void {
    this.fotoParaRecortar = '';
    this.imagenRecorte = null;
    this.recorteCargando = false;
  }

  async confirmarRecorte(): Promise<void> {
    if (!this.imagenRecorte) {
      return;
    }

    try {
      const datos = this.generarRecorte(this.imagenRecorte);
      this.fotos = [...this.fotos, { id: this.siguienteIdFoto++, datos }];
      this.fotoParaRecortar = '';
      this.imagenRecorte = null;
      this.recorteCargando = false;
    } catch (error) {
      console.error('No se pudo recortar la foto.', error);
      this.mensaje = 'No se pudo recortar la foto. Inténtalo nuevamente.';
    }
  }

  quitarFoto(id: number): void {
    this.fotos = this.fotos.filter((foto) => foto.id !== id);
  }

  async publicar(): Promise<void> {
    this.mensaje = '';
    this.mensajeEsExito = false;
    const caso = this.caso;

    if (!caso) {
      this.mensaje = 'Selecciona qué tipo de publicación quieres crear.';
      return;
    }

    const datos = caso === 'hogar'
      ? this.validarAnimalDeCasa()
      : this.validarAnimalEncontrado();

    if (!datos) {
      return;
    }

    const usuario = auth.currentUser;
    if (!usuario) {
      this.mensaje = 'Inicia sesión para guardar una publicación.';
      return;
    }

    this.guardando = true;
    try {
      this.publicacionesService.crearPublicacion(
        usuario.uid,
        caso,
        datos,
        this.fotos.map((foto) => foto.datos)
      );
      const navegada = await this.router.navigate(['/paginaprincipal']);
      if (!navegada) {
        this.mensaje = 'La publicación se guardó, pero no se pudo abrir la página principal.';
        this.mensajeEsExito = true;
      }
    } catch (error) {
      console.error('No se pudo crear la publicación.', error);
      this.mensaje = 'No se pudo guardar la publicación. Inténtalo nuevamente.';
    } finally {
      this.guardando = false;
    }
  }

  private validarAnimalDeCasa(): DatosPublicacion | null {
    if (!this.especieCasa || (this.especieCasa === 'Otro' && !this.otraEspecieCasa.trim())
      || (!this.sinNombre && !this.nombre.trim()) || !this.edad || Number(this.edad) < 0
      || !this.descripcion.trim() || !this.ciudad.trim() || this.esterilizado === null) {
      this.mensaje = 'Completa la especie, nombre (o indica que no tiene), edad, descripción, ciudad y esterilización.';
      return null;
    }

    return {
      especie: this.especieCasa === 'Otro' ? this.otraEspecieCasa.trim() : this.especieCasa,
      nombre: this.sinNombre ? '' : this.nombre.trim(),
      sinNombre: this.sinNombre,
      raza: this.raza.trim(),
      edad: Number(this.edad),
      tamanio: this.tamanio,
      descripcion: this.descripcion.trim(),
      esterilizado: this.esterilizado,
      sexo: this.sexo,
      vacunado: this.vacunado,
      desparasitado: this.desparasitado,
      peso: this.peso ? Number(this.peso) : null,
      color: this.color.trim(),
      ciudad: this.ciudad.trim(),
      compatibleNinos: this.compatibleNinos,
      compatibleMascotas: this.compatibleMascotas,
      entrenadoCasa: this.entrenadoCasa,
      veterinario: this.veterinario.trim(),
      ultimaVisita: this.ultimaVisita,
      proximaCita: this.proximaCita
    };
  }

  private validarAnimalEncontrado(): DatosPublicacion | null {
    if (!this.especieEncontrada || (this.especieEncontrada === 'Otro' && !this.otraEspecie.trim())
      || !this.lugarEncontrado.trim() || !this.fechaEncontrado || !this.descripcionEncontrado.trim()) {
      this.mensaje = 'Completa el tipo de animal, lugar, fecha y descripción del hallazgo.';
      return null;
    }

    return {
      especie: this.especieEncontrada === 'Otro' ? this.otraEspecie.trim() : this.especieEncontrada,
      lugarEncontrado: this.lugarEncontrado.trim(),
      fechaEncontrado: this.fechaEncontrado,
      descripcion: this.descripcionEncontrado.trim()
    };
  }

  private async abrirEditorRecorte(archivo: File): Promise<void> {
    const origen = await new Promise<string>((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        if (typeof lector.result === 'string') {
          resolve(lector.result);
        } else {
          reject(new Error('No se pudo leer la foto.'));
        }
      };
      lector.onerror = () => reject(lector.error || new Error('Error al leer la foto.'));
      lector.readAsDataURL(archivo);
    });

    this.fotoParaRecortar = origen;
    this.imagenRecorte = null;
    this.recorteCargando = true;
    this.zoomRecorte = 1;
    this.posicionXRecorte = 0;
    this.posicionYRecorte = 0;

    await new Promise<void>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => {
        this.imagenRecorte = elemento;
        this.recorteCargando = false;
        resolve();
      };
      elemento.onerror = () => {
        this.cancelarRecorte();
        reject(new Error('El archivo no contiene una imagen válida.'));
      };
      elemento.src = origen;
    });
  }

  private generarRecorte(imagen: HTMLImageElement): string {
    const lado = Math.min(imagen.width, imagen.height) / this.zoomRecorte;
    const maxX = imagen.width - lado;
    const maxY = imagen.height - lado;
    const origenX = (imagen.width - lado) / 2 + (maxX / 2) * (this.posicionXRecorte / 100);
    const origenY = (imagen.height - lado) / 2 + (maxY / 2) * (this.posicionYRecorte / 100);
    const escala = Math.min(1, 960 / lado);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(lado * escala));
    canvas.height = canvas.width;

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      throw new Error('No se pudo preparar la foto.');
    }

    contexto.drawImage(
      imagen,
      origenX,
      origenY,
      lado,
      lado,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas.toDataURL('image/jpeg', 0.78);
  }
}
