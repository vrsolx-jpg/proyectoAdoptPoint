import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 
import { environment } from '../../environments/environment';// Asegúrate de que esta ruta llegue a tu environment.ts

// Inicializa Firebase con tus credenciales
const app = initializeApp(environment.firebase);

// Exporta los servicios para usarlos en el resto de la app
export const auth = getAuth(app);
export const db = getFirestore(app);