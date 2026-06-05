# ⚔️ Planning RPG

> Planning Poker com temática RPG — estime histórias de usuário com sua guilda!

![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-ffca28?logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Firebase](#configuração-do-firebase)
- [Executar Localmente](#executar-localmente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Modelo de Dados (Firestore)](#modelo-de-dados-firestore)
- [Deploy para Produção](#deploy-para-produção)

---

## Visão Geral

Planning RPG é uma aplicação web de **Planning Poker** gamificada onde cada participante é um herói de uma guilda. Estime histórias de usuário usando cartas com raridades, ganhe XP, suba de nível e conquiste badges junto com seu time.

---

## Funcionalidades

### 🃏 Planning Poker
- Criar sessões com múltiplas histórias/tarefas
- Entrar em sessões via **código de convite** de 6 caracteres
- 28 cartas de votação com sistema de **raridade** (Common → Legendary → Special)
- Votação anônima e revelação simultânea
- Cálculo automático de média, mínimo, máximo e **consenso perfeito**
- **Média ponderada** por classe de personagem e categoria da história (Back-end / Front-end)
- Escolha da estimativa final pelo host
- Revisão de histórias finalizadas com histórico completo de votos

### ⚔️ Classes de Personagem

| Classe | Ícone | Descrição | Ponderação |
|---|---|---|---|
| Guerreiro Angular | ⚡ | Domina componentes e reatividade | Front ×1.2 / Back ×0.8 |
| Mago do C# | 🔷 | Conjura APIs e regras de negócio | Back ×1.2 / Front ×0.8 |
| Arqueiro FullStack | 🎯 | Atinge front e back com precisão | Back ×1.2 / Front ×1.2 |
| Mestre Tech Lead | 👑 | Guia a equipe com visão técnica | Back ×1.2 / Front ×1.2 |
| Pequeno Camponês | 🌾 | Iniciante em sua jornada de dev | Back ×0.8 / Front ×0.8 |

### 🏆 Gamificação
- **XP e Níveis**: cada voto = +10 XP, consenso perfeito = +50 XP bônus, nova sessão = +25 XP
- **10 títulos de progressão**: Iniciante → Aventureiro → Herói → Campeão → Lendário → Mestre → Grão-Mestre → Arquimago → Semideus → Imortal
- **17 conquistas** desbloqueáveis com recompensas de XP
- **Leaderboard** com pódio visual dos top 3
- Barra de XP animada na navbar

### Conquistas disponíveis

| Conquista | Condição | Raridade | XP |
|---|---|---|---|
| 🗳️ Primeira Pedra | 1ª votação | Common | +50 |
| 🏆 Estimador Veterano | 10 votações | Uncommon | +100 |
| 🃏 Mestre das Cartas | 50 votações | Rare | +250 |
| 🎴 Centurião das Cartas | 100 votações | Epic | +500 |
| 🧙 Lenda das Estimativas | 250 votações | Legendary | +1.500 |
| 👑 Imortal das Cartas | 500 votações | Legendary | +3.000 |
| ⚔️ Aventureiro | 1ª sessão | Common | +75 |
| 🛡️ Companheiro de Guilda | 10 sessões | Uncommon | +200 |
| 🗡️ Veterano da Mesa | 25 sessões | Rare | +350 |
| 🏰 Senhor da Guilda | 50 sessões | Epic | +750 |
| 🐉 Soberano das Plannings | 100 sessões | Legendary | +2.000 |
| 🔮 Mente Coletiva | 1 consenso perfeito | Rare | +150 |
| ✨ Oráculo da Equipe | 5 consensos perfeitos | Epic | +400 |
| 🌟 Lenda Viva | 20 consensos perfeitos | Legendary | +1.000 |
| 💎 Mente Suprema | 10 consensos perfeitos | Epic | +600 |
| ⚡ Profeta Eterno | 50 consensos perfeitos | Legendary | +2.500 |
| 🌠 Divindade do Consenso | 100 consensos perfeitos | Legendary | +5.000 |

### 🔵 Integração com Azure DevOps
- Importar tarefas filhas de uma User Story diretamente para a sessão via **ID da US**
- Detecção automática de categoria (Back-end / Front-end) pelo título da task
- Ao finalizar a votação, **sincronizar a estimativa final** de volta para o work item no Azure (`OriginalEstimate` e `RemainingWork`) com um clique

### 👤 Perfil
- Edição do nome de exibição diretamente na tela de perfil
- Troca de classe de personagem a qualquer momento
- Histórico de conquistas desbloqueadas

---

## Pré-requisitos

- **Node.js** 18+
- **npm** 9+
- Conta no [Firebase Console](https://console.firebase.google.com)

---

## Configuração do Firebase

### 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** e siga o assistente
3. No projeto criado, clique em **"Adicionar app"** → ícone **Web (`</>`)**
4. Registre o app e copie o objeto `firebaseConfig`

### 2. Ativar Authentication

Menu lateral → **Authentication → Sign-in method**
- Habilite **E-mail/senha**
- Habilite **Google** (opcional, mas recomendado)

### 3. Ativar Firestore

Menu lateral → **Firestore Database → Criar banco de dados**
- Escolha **"Modo de produção"** (as regras já estão em `firestore.rules`)
- Região sugerida: `southamerica-east1`

### 4. Configurar credenciais (sem versionar segredos)

Copie os arquivos de exemplo:

```bash
cp src/environments/environment.example.ts src/environments/environment.local.ts
cp src/environments/environment.prod.example.ts src/environments/environment.local.prod.ts
```

Edite `src/environments/environment.local.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSy...',
    authDomain: 'meu-projeto.firebaseapp.com',
    projectId: 'meu-projeto',
    storageBucket: 'meu-projeto.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
  },
};
```

Repita em `src/environments/environment.local.prod.ts`.

`environment.local.ts` e `environment.local.prod.ts` ficam no `.gitignore`, então suas credenciais Firebase não sobem para o Git.

### 5. Deploy das regras e índices

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # selecione seu projeto Firebase
firebase deploy --only firestore
```

---

## Executar Localmente

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento (http://localhost:4200)
ng serve
```

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   ├── user.model.ts         # UserProfile, XP, níveis, classes
│   │   │   ├── session.model.ts      # Session, Participant
│   │   │   ├── story.model.ts        # Story, cartas, raridades, azureWorkItemId
│   │   │   ├── vote.model.ts         # Vote, VoteResult, ponderação por classe
│   │   │   └── achievement.model.ts  # ACHIEVEMENTS (17 conquistas)
│   │   ├── services/
│   │   │   ├── firebase.service.ts   # Inicialização Firebase (singleton)
│   │   │   ├── auth.service.ts       # Login, registro, Google OAuth
│   │   │   ├── user.service.ts       # Perfil, XP, conquistas, leaderboard
│   │   │   ├── session.service.ts    # Sessões, histórias, votos (Firestore RT)
│   │   │   ├── azure.service.ts      # Importar tasks e sincronizar estimativas
│   │   │   ├── azure-auth.store.ts   # PAT em memória para interceptor
│   │   │   └── notification.service.ts # Sistema de toasts
│   │   ├── guards/
│   │   │   └── auth.guard.ts         # authGuard + publicGuard
│   │   ├── interceptors/
│   │   │   └── azure.interceptor.ts  # Injeta Authorization: Basic nos requests Azure
│   │   └── pipes/
│   │       └── xp-level.pipe.ts      # | xpLevel:'level'|'title'|'progress'
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/                # Tela de login (email + Google)
│   │   │   └── register/             # Registro + seleção de classe RPG
│   │   ├── dashboard/                # Hero, sessões ativas, histórico
│   │   ├── sessions/
│   │   │   ├── session-create/       # Formulário de nova sessão
│   │   │   └── session-room/         # Sala de votação em tempo real
│   │   ├── profile/                  # Stats, edição de nome, troca de classe
│   │   └── leaderboard/              # Pódio + ranking completo
│   ├── app-module.ts
│   ├── app-routing-module.ts
│   └── app.ts / app.html / app.scss
├── environments/
│   ├── environment.ts                # ← credenciais Firebase (dev)
│   └── environment.prod.ts           # ← credenciais Firebase (prod)
└── styles/
    ├── _variables.scss               # Paleta RPG, tipografia, espaçamentos
    └── _animations.scss              # cardReveal, glow-pulse, float, shimmer...
```

---

## Modelo de Dados (Firestore)

```
users/
  {uid}
    displayName, email, characterClass
    xp, level
    totalVotes, totalSessions, perfectConsensus
    achievements: [{ id, name, icon, unlockedAt }]

    private/azure
      pat, organization, project

sessions/
  {sessionId}
    name, description, inviteCode
    hostId, hostName, status, participants[]
    currentStoryId, totalStories, completedStories

    stories/
      {storyId}
        title, description, category (back|front), status, order
        finalEstimate, azureWorkItemId?
        votingStartedAt, completedAt

        votes/
          {uid}
            userId, userName, characterClass, value
```

---

## Deploy para Produção

```bash
# Build otimizado
ng build --configuration=production

# Deploy no Firebase Hosting
firebase deploy
```

URL gerada: `https://seu-projeto.web.app`

---

## Aviso de Segurança

As credenciais do Firebase em `environment.ts` são **chaves de cliente** (não secret keys) e são necessárias no frontend. Para proteger os dados, as **Regras de Segurança do Firestore** (`firestore.rules`) garantem que cada usuário só escreva seus próprios dados. O PAT do Azure DevOps é armazenado em `users/{uid}/private/azure` e nunca exposto a outros usuários. Não exponha credenciais de **Admin SDK** ou service accounts no frontend.

---

## Licença

MIT
