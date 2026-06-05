---
name: git-push
description: Subir mudanças no git — fazer commit e push para o repositório. Use quando o usuário pedir para commitar, subir no git, fazer push, salvar no repositório ou enviar alterações.
---

# git-push — Commit e push para o GitHub

Repositório: `https://github.com/lucasbriguenti/planning_rpg.git`
Branch principal: `main` (tracking `origin/main`)

## Fluxo completo

### 1. Verificar o que mudou

```bash
git status
git diff --stat
git log --oneline -5
```

### 2. Verificar build (obrigatório antes do push)

```bash
ng build 2>&1 | tail -5
```

Só prossiga se terminar com `Application bundle generation complete`. Warnings de budget são aceitáveis; erros de compilação não.

### 3. Escolher os arquivos a commitar

Sempre adicione arquivos **por nome**, nunca `git add .` ou `git add -A`.

```bash
git add src/app/features/profile/profile.component.ts src/styles.scss
# etc — listar os arquivos relevantes para a mudança
```

Para incluir arquivos novos (untracked):

```bash
git add src/app/core/components/novo-componente/
```

### 4. Criar o commit

Mensagens em **português**, imperativo, sem ponto final. Sem prefixos `feat:`/`fix:` — o projeto não usa conventional commits.

```bash
git commit -m "$(cat <<'EOF'
Descrição curta da mudança

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Exemplos de mensagens do projeto:
- `Adicionado modal de ajuda do Azure e banner de instalação iOS`
- `Adicionado pwa`
- `Mudado regras do firebase`
- `Ajuste nas votacoes`

### 5. Push

```bash
git push
```

O remote `origin` já está configurado para `https://github.com/lucasbriguenti/planning_rpg.git`. Nenhum `--set-upstream` necessário — a branch `main` já rastreia `origin/main`.

## Gotchas

- **`git add -A` pode incluir `environment.local.ts`** (credenciais Firebase) — sempre adicione por arquivo
- **Build quebrado bloqueia o push** — se `ng build` falhar, corrija antes de commitar
- **Warnings de SCSS no build são ok** — `session-room.component.scss` excede budget, mas está dentro do limite configurado (16kB); não é motivo para bloquear
- **`ngsw-config.json` e `public/manifest.webmanifest`** fazem parte do projeto (PWA) — commitar normalmente quando alterados
