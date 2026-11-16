import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // 1. Nueva importación de Firestore
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebase);

export const auth = getAuth(app);
export const db = getFirestore(app); // 2. Nueva exportación de la base de datos