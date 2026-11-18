import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setPersistence: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn()
}));

vi.mock('firebase/auth', async (importarOriginal) => ({
  ...await importarOriginal<typeof import('firebase/auth')>(),
  browserLocalPersistence: {},
  GoogleAuthProvider: class {
    setCustomParameters(): void {}
  },
  setPersistence: mocks.setPersistence,
  signInWithPopup: mocks.signInWithPopup,
  signInWithRedirect: mocks.signInWithRedirect
}));

import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setPersistence.mockReturnValue(new Promise(() => undefined));
    mocks.signInWithPopup.mockReturnValue(new Promise(() => undefined));
    mocks.signInWithRedirect.mockResolvedValue(undefined);
  });

  it('abre Google sin esperar la persistencia para conservar el gesto del clic', () => {
    const service = new AuthService();

    void service.iniciarConGoogle();

    expect(mocks.signInWithPopup).toHaveBeenCalledOnce();
  });

  it('muestra el bloqueo del popup cuando la redirección sería entre dominios', async () => {
    mocks.signInWithPopup.mockRejectedValue(
      Object.assign(new Error('blocked'), { code: 'auth/popup-blocked' })
    );
    const service = new AuthService();

    await expect(service.iniciarConGoogle()).rejects.toMatchObject({ code: 'auth/popup-blocked' });

    expect(mocks.signInWithRedirect).not.toHaveBeenCalled();
  });

  it('propaga otros errores sin iniciar una redirección', async () => {
    const error = Object.assign(new Error('network'), { code: 'auth/network-request-failed' });
    mocks.signInWithPopup.mockRejectedValue(error);
    const service = new AuthService();

    await expect(service.iniciarConGoogle()).rejects.toBe(error);

    expect(mocks.signInWithRedirect).not.toHaveBeenCalled();
  });
});
