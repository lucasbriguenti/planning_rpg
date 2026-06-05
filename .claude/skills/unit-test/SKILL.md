---
name: unit-test
description: Criar, rodar e estender testes de unidade neste projeto. Use quando o usuário pedir para escrever testes, adicionar cobertura, testar uma função ou rodar o suite de testes.
---

# Testes de unidade — Planning RPG

Framework: **Vitest 4.x**, ambiente `node` (sem DOM). Os specs ficam em `src/**/*.spec.ts` e são descobertos automaticamente.

## Rodar os testes

```bash
npm test                  # roda uma vez
npm run test:watch        # modo watch (interativo)
npm run test:coverage     # gera relatório de cobertura em text + lcov
```

Saída esperada de uma execução limpa:

```
 Test Files  3 passed (3)
      Tests  56 passed (56)
   Duration  ~110ms
```

## O que é testável diretamente

Somente **funções puras em `src/app/core/models/`** têm cobertura agora. Essas funções não dependem de Angular nem Firebase e podem ser importadas diretamente:

| Arquivo | Funções exportadas |
|---|---|
| `user.model.ts` | `xpForLevel`, `levelFromXp`, `xpProgressInLevel`, `getLevelTitle` |
| `vote.model.ts` | `getVoteWeight`, `calculateVoteResult` |
| `achievement.model.ts` | `ACHIEVEMENTS` (array + campo `condition`) |

## O que NÃO tem suporte a teste ainda

Os **serviços** (`AuthService`, `SessionService`, `UserService`, …) chamam Firebase diretamente (`onSnapshot`, `getDoc`, `setDoc`). Para testá-los seria necessário mockar o SDK do Firebase. Isso ainda não está configurado no projeto — **não crie specs de serviço sem antes adicionar essa infraestrutura**.

## Padrão dos specs

Todos os specs existentes seguem o mesmo padrão — copie este esqueleto ao criar um novo:

```typescript
import { describe, it, expect } from 'vitest';
import { minhaFuncao } from './meu-arquivo.model';

// helper factory (quando o tipo tem muitos campos opcionais)
function makeEntidade(overrides: Partial<MinhaInterface> = {}): MinhaInterface {
  return { campo1: 'valor', campo2: 0, ...overrides };
}

describe('minhaFuncao', () => {
  it('caso normal', () => {
    expect(minhaFuncao(makeEntidade())).toBe(valorEsperado);
  });

  it('caso limite', () => {
    expect(minhaFuncao(makeEntidade({ campo1: '' }))).toBe(0);
  });
});
```

Regras de estilo observadas nos specs existentes:
- Descrição do `it` em português, no formato `"condição: resultado esperado"`.
- Um `describe` por função exportada.
- Factory helper para tipos com muitos campos — nunca construa o objeto inline em cada `it`.
- Sem `beforeEach`/`afterEach` quando o estado é criado localmente em cada teste.
- Sem mocks (`vi.mock`, `vi.spyOn`) — os models são funções puras.

## Onde criar o arquivo spec

Coloque o spec ao lado do arquivo que ele testa:

```
src/app/core/models/minha-feature.model.ts
src/app/core/models/minha-feature.model.spec.ts   ← aqui
```

## Verificar cobertura de uma função específica

```bash
npm run test:coverage 2>&1 | grep "minha-feature"
```

O relatório mostra linhas descobertas. O alvo atual de cobertura é `src/app/core/**/*.ts`.

## Gotchas

- **`globals: true`** está ativo no `vitest.config.ts`, então `describe`/`it`/`expect` são globais — mas os specs existentes importam explicitamente de `vitest` mesmo assim, por clareza. Siga o mesmo padrão.
- O ambiente é `node`, não `jsdom`. Código que usa `document`, `window` ou qualquer API do DOM vai falhar. Componentes Angular **não podem ser testados** neste setup sem configuração adicional.
- `calculateVoteResult` recebe `Vote[]`; o `id`, `sessionId` e `storyId` são obrigatórios no tipo mas irrelevantes para a lógica — use a factory `makeVote` de `vote.model.spec.ts` como referência para não poluir os testes com boilerplate.
