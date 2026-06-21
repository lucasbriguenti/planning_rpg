# Plano de estudo Playwright (iniciante -> avançado)

Este plano é para uma pessoa não técnica aprender a testar a aplicação com Playwright, começando da instalação até cenários complexos.

## Semana 1 - Primeiros passos

### Dia 1 - Entender o básico
- O que é teste manual e teste automatizado.
- O que é um "cenário de teste".
- Liste 5 cenários simples da aplicação (ex.: abrir tela inicial, clicar em entrar).

### Dia 2 - Instalar o Playwright
- Instalar o Node.js no computador (pré-requisito).
- Rodar `npm init playwright@latest` dentro da pasta do projeto.
- Validar a instalação com `npx playwright test --version`.
- Entender onde ficam os arquivos de teste (pasta `e2e/` ou `tests/`).

### Dia 3 - Primeiro teste (primeira página)
- Usar o gerador automático de testes: `npx playwright codegen <url-da-aplicacao>`.
- Gravar uma sequência simples: abrir a aplicação, verificar texto da tela inicial.
- Salvar o teste gerado como `home.spec.ts` e rodá-lo com `npx playwright test`.

### Dia 4 - Interações simples
- Criar testes curtos para:
  - clicar em botão (`page.click`);
  - preencher campo (`page.fill`);
  - navegar para outra tela (`page.goto`).
- Usar `expect(page).toHaveURL()` e `expect(page.locator(...)).toBeVisible()`.

### Dia 5 - Repetição guiada
- Rodar os testes 3 vezes com `npx playwright test`.
- Abrir o relatório visual com `npx playwright show-report`.
- Corrigir qualquer instabilidade observando os screenshots de falha.

## Semana 2 - Fluxos principais

### Meta
Cobrir uma jornada real do usuário.

- Login/registro.
- Entrada no dashboard.
- Criação de sessão.
- Entrada por código de convite.

**Dica:** use `npx playwright test --ui` para rodar e depurar no modo visual (step-by-step).

**Entrega:** 1 fluxo E2E completo funcionando do início ao fim.

## Semana 3 - Regras de negócio da app

### Meta
Testar o coração do produto.

- Votação de participantes.
- Revelação de votos.
- Encerramento de história/sessão.

**Entrega:** testes com caminho de sucesso + pelo menos 1 caminho de erro.

## Semana 4 - Dados e confiabilidade

### Meta
Evitar testes "quebradiços".

- Usar `beforeEach` para preparar estado antes de cada teste.
- Criar arquivos de fixture com dados de teste previsíveis.
- Garantir que o teste funcione em qualquer máquina usando variáveis de ambiente (`.env`).
- Reduzir dependência de intervenção manual.

**Entrega:** suíte rodando com resultado estável.

## Semana 5 - Erros e exceções

### Meta
Validar comportamentos de falha.

- Login inválido.
- Código de sessão inválido.
- Falha de integração (ex.: Azure/PAT inválido).

**Entrega:** suíte com cenários de sucesso e de erro.

## Semana 6 - Organização profissional

### Meta
Escalar com clareza.

- Organizar testes por funcionalidade (uma pasta por módulo: `auth/`, `sessao/`, `votacao/`).
- Padronizar nomes de arquivos (`<funcionalidade>.spec.ts`).
- Extrair ações repetidas em funções auxiliares (`Page Objects`).

**Entrega:** estrutura limpa e fácil de manter.

## Semana 7 - Pipeline (CI/CD)

### Meta
Executar testes automaticamente.

- Rodar `npx playwright test` no pipeline (Playwright tem suporte nativo ao GitHub Actions e Azure Pipelines).
- Bloquear entrega quando teste crítico falhar.
- Publicar relatório HTML como artefato do pipeline para o time visualizar.

**Entrega:** gate de qualidade ativo.

## Semana 8+ - Nível avançado

### Meta
Melhoria contínua.

- Monitorar flakiness (instabilidade) com `--repeat-each` e trace viewer (`npx playwright show-trace`).
- Priorizar testes mais críticos com `test.only` e tags.
- Revisar e otimizar o tempo de execução (paralelismo, `workers`).

**Entrega:** plano mensal de manutenção da suíte.

## Critérios de avanço (simples)

1. Só avançar de etapa quando os testes atuais passarem 3 execuções seguidas.
2. Cada funcionalidade nova deve ter:
   - 1 cenário feliz;
   - 1 cenário de erro.
3. Prioridade sempre para fluxos críticos: login, sessão, votação, encerramento.
