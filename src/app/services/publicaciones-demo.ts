import type { DatosPublicacion, Publicacion } from './publicaciones.service';
import { creditosCatalogo } from './creditos-catalogo';

const originales = [
  { id: 'coco', nombre: 'Coco', especie: 'Perro', ciudad: 'Bogotá', foto: 'perro.jpg', edad: 'adulto', tamanio: 'Mediano', sexo: 'Macho', descripcion: 'Cariñoso y sociable. Le encantan los paseos y jugar con la pelota.' },
  { id: 'fili', nombre: 'Fili', especie: 'Gato', ciudad: 'Bogotá', foto: 'fili.jpg', edad: 'cachorro', tamanio: 'Pequeño', sexo: 'Macho', descripcion: 'Curioso y juguetón. Siempre encuentra un rincón al sol para su siesta.' },
  { id: 'mora', nombre: 'Mora', especie: 'Perro', ciudad: 'Medellín', foto: 'perro2.jpg', edad: 'adulto', tamanio: 'Mediano', sexo: 'Hembra', descripcion: 'Disfruta de los paseos tranquilos y aprende rápido con premios.' },
  { id: 'nina', nombre: 'Nina', especie: 'Gato', ciudad: 'Cali', foto: 'gato.jpg', edad: 'adulto', tamanio: 'Pequeño', sexo: 'Hembra', descripcion: 'Le gustan los rincones altos y las tardes tranquilas en compañía.' },
  { id: 'tango', nombre: 'Tango', especie: 'Perro', ciudad: 'Bucaramanga', foto: 'perro3.jpg', edad: 'mayor', tamanio: 'Grande', sexo: 'Macho', descripcion: 'De carácter tranquilo, ideal para quien quiere compartir paseos cortos.' }
] as const;

const catalogo: (DatosPublicacion & { id: keyof typeof creditosCatalogo })[] = [
  {
    id: 'bruno', nombre: 'Bruno', especie: 'Perro', raza: 'Golden retriever', ciudad: 'Bogotá',
    edad: 'adulto', tamanio: 'Grande', sexo: 'Macho', color: 'Dorado', peso: 29, esterilizado: true,
    vacunado: true, desparasitado: true, compatibleNinos: true, compatibleMascotas: true, entrenadoCasa: true,
    descripcion: 'Bruno es sociable y siempre lleva una pelota en la boca. Le van bien los paseos largos y las familias que disfrutan pasar tiempo al aire libre.'
  },
  {
    id: 'canela', nombre: 'Canela', especie: 'Perro', raza: 'Beagle', ciudad: 'Neiva',
    edad: 'cachorro', tamanio: 'Mediano', sexo: 'Hembra', color: 'Tricolor', peso: 9, esterilizado: false,
    vacunado: true, desparasitado: true, compatibleNinos: true, compatibleMascotas: true, entrenadoCasa: false,
    descripcion: 'Curiosa y activa. Le gusta seguir rastros y aprende rápido con juegos de olfato. Sigue aprendiendo la rutina de la casa.'
  },
  {
    id: 'teo', nombre: 'Teo', especie: 'Perro', raza: 'Schnauzer miniatura', ciudad: 'Manizales',
    edad: 'mayor', tamanio: 'Pequeño', sexo: 'Macho', color: 'Sal y pimienta', peso: 7, esterilizado: true,
    vacunado: true, desparasitado: true, compatibleNinos: null, compatibleMascotas: false, entrenadoCasa: true,
    descripcion: 'Tiene buen ánimo para paseos cortos. Disfruta las siestas cerca de la gente y prefiere un hogar tranquilo donde sea la única mascota.'
  },
  {
    id: 'lia', nombre: 'Lía', especie: 'Gato', raza: 'Maine Coon', ciudad: 'Medellín',
    edad: 'adulto', tamanio: 'Grande', sexo: 'Hembra', color: 'Atigrado', peso: 6.2, esterilizado: true,
    vacunado: true, desparasitado: true, compatibleNinos: true, compatibleMascotas: null, entrenadoCasa: true,
    descripcion: 'Tranquila y curiosa. Observa todo desde los lugares altos y busca compañía a su ritmo. Le gusta que la cepillen con suavidad.'
  },
  {
    id: 'luna', nombre: 'Luna', especie: 'Gato', raza: 'Siamés', ciudad: 'Cali',
    edad: 'adulto', tamanio: 'Mediano', sexo: 'Hembra', color: 'Crema con puntas oscuras', peso: 4, esterilizado: true,
    vacunado: true, desparasitado: true, compatibleNinos: null, compatibleMascotas: true, entrenadoCasa: true,
    descripcion: 'Comunicativa y cariñosa con quienes conoce. Sus favoritos son los juguetes de varita y las tardes al sol.'
  },
  {
    id: 'mila', nombre: 'Mila', especie: 'Gato', raza: 'Doméstico de pelo corto', ciudad: 'Barranquilla',
    edad: 'cachorro', tamanio: 'Pequeño', sexo: 'Hembra', color: 'Blanco, negro y naranja', peso: 2.5, esterilizado: false,
    vacunado: false, desparasitado: true, compatibleNinos: true, compatibleMascotas: true, entrenadoCasa: true,
    descripcion: 'Juega con cajas y duerme en lugares cálidos. Ya usa el arenero y necesita completar su revisión veterinaria.'
  },
  {
    id: 'copito', nombre: 'Copito', especie: 'Conejo', raza: 'Belier holandés', ciudad: 'Pereira',
    edad: 'cachorro', tamanio: 'Pequeño', sexo: 'Hembra', color: 'Negro', peso: 1.3, esterilizado: false,
    vacunado: null, desparasitado: null, compatibleNinos: null, compatibleMascotas: false, entrenadoCasa: false,
    descripcion: 'Explora túneles y se acerca a buscar heno. Le gusta tener un espacio amplio a ras de suelo y esconderse cuando necesita tranquilidad.'
  },
  {
    id: 'kiwi', nombre: 'Kiwi', especie: 'Ave', raza: 'Periquito australiano', ciudad: 'Bucaramanga',
    edad: 'adulto', tamanio: 'Pequeño', sexo: 'Macho', color: 'Verde y amarillo', peso: 0.04, esterilizado: false,
    vacunado: null, desparasitado: null, compatibleNinos: null, compatibleMascotas: null, entrenadoCasa: false,
    descripcion: 'Alerta y sociable con otros periquitos. Le gusta explorar perchas y responder a los sonidos suaves. La foto muestra periquitos de referencia.'
  },
  {
    id: 'pipa', nombre: 'Pipa', especie: 'Cuy', raza: 'Cuy doméstico de pelo corto', ciudad: 'Pasto',
    edad: 'adulto', tamanio: 'Pequeño', sexo: 'Hembra', color: 'Tricolor', peso: 0.8, esterilizado: false,
    vacunado: null, desparasitado: null, compatibleNinos: null, compatibleMascotas: null, entrenadoCasa: false,
    descripcion: 'Busca pedacitos de verdura y se esconde entre el heno. Se siente cómoda con personas pacientes y una rutina tranquila.'
  },
  {
    id: 'sol', nombre: 'Sol', especie: 'Ave', raza: 'Ninfa', ciudad: 'Ibagué',
    edad: 'adulto', tamanio: 'Pequeño', sexo: 'Macho', color: 'Gris, amarillo y naranja', peso: 0.09, esterilizado: false,
    vacunado: null, desparasitado: null, compatibleNinos: null, compatibleMascotas: null, entrenadoCasa: false,
    descripcion: 'Silba cuando escucha música y es curioso con los juguetes de papel. Necesita tiempo y un espacio seguro para acostumbrarse a las personas.'
  }
];

function fichaDemo(id: string, foto: string, datos: DatosPublicacion): Publicacion {
  return {
    id: 'demo-' + id,
    usuarioId: 'adoptpoint-demo',
    publicador: 'Equipo AdoptPoint',
    demostracion: true,
    caso: 'hogar',
    creadaEn: '2026-01-01T00:00:00.000Z',
    fotos: ['assets/img/' + foto],
    datos
  };
}

export const publicacionesDemo: Publicacion[] = [
  ...originales.map(({ id, foto, ...datos }) => fichaDemo(id, foto, datos)),
  ...catalogo.map(({ id, ...datos }) => ({
    ...fichaDemo(id, 'catalogo/' + id + '.jpg', { ...datos, sinNombre: false }),
    creditoFoto: creditosCatalogo[id]
  }))
];
