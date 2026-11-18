import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

const dominio = globalThis.location?.hostname;
const proyectosAlojados = ['adoptpoint.firebaseapp.com', 'adoptpoint.web.app'];
const authDomain = dominio && proyectosAlojados.includes(dominio) ? dominio : environment.firebase.authDomain;
const app = initializeApp({ ...environment.firebase, authDomain });

export const auth = getAuth(app);
export const db = getFirestore(app);