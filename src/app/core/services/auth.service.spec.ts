import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService.getDeleteAccountErrorMessage', () => {
  const getMessage = AuthService.prototype.getDeleteAccountErrorMessage;

  it('retorna orientação de relogin para requires-recent-login', () => {
    const message = getMessage.call({} as AuthService, { code: 'auth/requires-recent-login' });
    expect(message).toContain('faça login novamente');
  });

  it('retorna orientação de conexão para falha de rede', () => {
    const message = getMessage.call({} as AuthService, { code: 'auth/network-request-failed' });
    expect(message).toContain('internet');
  });

  it('retorna mensagem genérica para erros desconhecidos', () => {
    const message = getMessage.call({} as AuthService, { code: 'auth/unknown' });
    expect(message).toContain('Não foi possível excluir');
  });
});
