# Napkin Runbook

## Regras de Curadoria

- Repriorize em toda leitura.
- Mantenha apenas notas recorrentes e de alto valor.
- Máximo de 10 itens por categoria.
- Cada item inclui data + "Faça em vez disso".

## Execução e Validação (Maior Prioridade)

1. **[2026-06-05] Testes deste repo são via Vitest (não ng test)**
   Faça em vez disso: use `npm test`/`npm run test:coverage` e para foco rápido rode `npm test -- <arquivo.spec.ts>` ou `npm test -- -t "<nome do teste>"`.

2. **[2026-06-03] Valide build/lint/test antes e depois de mudanças grandes**
   Faça em vez disso: execute os scripts existentes do projeto em baseline e repita após implementar alterações estruturais.

## Confiabilidade de Shell e Comandos

1. **[2026-06-03] Prefira leitura/edição com ferramentas nativas**
   Faça em vez disso: use `glob`, `rg`, `view` e `apply_patch` para reduzir erros em comparação com scripts ad-hoc.

## Guardrails de Comportamento de Domínio

1. **[2026-06-03] Preserve sincronização em tempo real em features colaborativas**
   Faça em vez disso: centralize estado compartilhado em serviços reativos e persista no Firestore para evitar divergência entre clientes.

## Diretrizes do Usuário

1. **[2026-06-03] Entregar projeto completo Angular + Firebase com tema RPG**
   Faça em vez disso: implementar arquitetura modular com sessões, votação, gamificação, responsividade e instruções de setup local.
