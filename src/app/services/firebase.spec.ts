import { describe, expect, it } from 'vitest';
import { auth, db } from './firebase';
import { auth as autenticacionPrincipal, db as basePrincipal } from '../firebase';

describe('Firebase', () => {
  it('comparte la misma autenticación y base de datos en ambas rutas de importación', () => {
    expect(auth).toBe(autenticacionPrincipal);
    expect(db).toBe(basePrincipal);
  });
});
