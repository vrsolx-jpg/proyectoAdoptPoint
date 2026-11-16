import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setPersistence: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  browserLocalPersistence: {},
  GoogleAuthProvider: class {
    setCustomParameters(): void {}
  },
  setPersistence: mocks.setPersistence,
  signInWithPopup: mocks.signInWithPopup,
  signInWithRedirect: mocks.signInWithRedirect
}));

vi.mock('./firebase', () => ({ auth: {} }));

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

  it('continúa con redirección si el navegador bloquea el popup', async () => {
    mocks.signInWithPopup.mockRejectedValue(
      Object.assign(new Error('blocked'), { code: 'auth/popup-blocked' })
    );
    const service = new AuthService();

    await service.iniciarConGoogle();

    expect(mocks.signInWithRedirect).toHaveBeenCalledOnce();
  });

  it('propaga otros errores sin iniciar una redirección', async () => {
    const error = Object.assign(new Error('network'), { code: 'auth/network-request-failed' });
    mocks.signInWithPopup.mockRejectedValue(error);
    const service = new AuthService();

    await expect(service.iniciarConGoogle()).rejects.toBe(error);

    expect(mocks.signInWithRedirect).not.toHaveBeenCalled();
  });
});
