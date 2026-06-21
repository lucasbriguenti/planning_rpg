import { test, expect } from '@playwright/test';

// Firebase REST endpoint intercepted to simulate auth errors/success
const FIREBASE_SIGN_IN_URL = '**/accounts:signInWithPassword**';

async function fillLoginForm(page: import('@playwright/test').Page, email: string, password: string) {
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
}

async function mockFirebaseError(page: import('@playwright/test').Page, errorCode: string) {
  await page.route(FIREBASE_SIGN_IN_URL, route =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 400, message: errorCode } }),
    })
  );
}

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test.describe('Elementos da página', () => {
    test('exibe o título e logo da aplicação', async ({ page }) => {
      await expect(page.locator('.auth-title')).toBeVisible();
      await expect(page.locator('.auth-title')).toContainText('Planning');
    });

    test('campo e-mail está presente com placeholder correto', async ({ page }) => {
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('placeholder', 'heroi@guilda.com');
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('campo senha está presente', async ({ page }) => {
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('botão de submit "Entrar na Batalha" está visível', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Entrar na Batalha/i })).toBeVisible();
    });

    test('botão "Entrar com Google" está visível', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Entrar com Google/i })).toBeVisible();
    });

    test('link para criação de conta aponta para /auth/register', async ({ page }) => {
      const link = page.getByRole('link', { name: /Crie sua personagem/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', '/auth/register');
    });
  });

  test.describe('Validação de formulário', () => {
    test('botão submit está desabilitado com formulário vazio', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Entrar na Batalha/i })).toBeDisabled();
    });

    test('botão submit está desabilitado com email inválido', async ({ page }) => {
      await fillLoginForm(page, 'nao-e-um-email', 'senha123');
      await expect(page.getByRole('button', { name: /Entrar na Batalha/i })).toBeDisabled();
    });

    test('botão submit está desabilitado com senha menor que 6 caracteres', async ({ page }) => {
      await fillLoginForm(page, 'heroi@guilda.com', '12345');
      await expect(page.getByRole('button', { name: /Entrar na Batalha/i })).toBeDisabled();
    });

    test('botão submit fica habilitado com email e senha válidos', async ({ page }) => {
      await fillLoginForm(page, 'heroi@guilda.com', 'senha123');
      await expect(page.getByRole('button', { name: /Entrar na Batalha/i })).toBeEnabled();
    });

    test('toggle de visibilidade: senha fica visível ao clicar no botão 👁️', async ({ page }) => {
      const passwordInput = page.locator('#password');
      const toggleButton = page.locator('.input-toggle');

      await expect(passwordInput).toHaveAttribute('type', 'password');
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Mensagens de erro do Firebase', () => {
    test.beforeEach(async ({ page }) => {
      await fillLoginForm(page, 'heroi@guilda.com', 'senha123');
    });

    test('exibe "Email ou senha inválidos" para credenciais incorretas', async ({ page }) => {
      await mockFirebaseError(page, 'INVALID_LOGIN_CREDENTIALS');
      await page.getByRole('button', { name: /Entrar na Batalha/i }).click();
      await expect(page.locator('.toast-message')).toContainText('Email ou senha inválidos');
    });

    test('exibe "Usuário não encontrado" quando o e-mail não existe', async ({ page }) => {
      await mockFirebaseError(page, 'EMAIL_NOT_FOUND');
      await page.getByRole('button', { name: /Entrar na Batalha/i }).click();
      await expect(page.locator('.toast-message')).toContainText('Usuário não encontrado');
    });

    test('exibe "Senha incorreta" para senha errada', async ({ page }) => {
      await mockFirebaseError(page, 'INVALID_PASSWORD');
      await page.getByRole('button', { name: /Entrar na Batalha/i }).click();
      await expect(page.locator('.toast-message')).toContainText('Senha incorreta');
    });

    test('exibe aviso de bloqueio após muitas tentativas', async ({ page }) => {
      await mockFirebaseError(page, 'TOO_MANY_ATTEMPTS_TRY_LATER');
      await page.getByRole('button', { name: /Entrar na Batalha/i }).click();
      await expect(page.locator('.toast-message')).toContainText('Muitas tentativas');
    });
  });

  test.describe('Guards e navegação', () => {
    test('usuário não autenticado é redirecionado ao acessar /dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('link "Crie sua personagem" navega para /auth/register', async ({ page }) => {
      await page.getByRole('link', { name: /Crie sua personagem/i }).click();
      await expect(page).toHaveURL(/\/auth\/register/);
    });
  });
});
