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
- Cartas Fibonacci com sistema de **raridade** (Common → Legendary)
- Votação anônima e revelação simultânea
- Cálculo automático de média, mínimo, máximo e **consenso perfeito**
- Escolha da estimativa final pelo host

### ⚔️ Classes de Personagem

| Classe | Ícone | Descrição |
|---|---|---|
| Guerreiro | ⚔️ | Estimativas diretas e assertivas |
| Mago | 🔮 | Analítico e preciso |
| Arqueiro | 🏹 | Rápido e focado |
| Ladino | 🗡️ | Estratégico e adaptável |
| Paladino | 🛡️ | Busca consenso na equipe |
| Necromante | 💀 | Ressuscita histórias antigas |

### 🏆 Gamificação
- **XP e Níveis**: cada voto = +10 XP, consenso perfeito = +50 XP bônus, nova sessão = +25 XP
- **10 títulos de progressão**: Iniciante → Imortal
- **8 Conquistas** desbloqueáveis com recompensas de XP
- **Leaderboard** com pódio visual dos top 3
- Barra de XP animada na navbar

### Conquistas disponíveis

| Conquista | Condição | XP |
|---|---|---|
| 🗳️ Primeira Pedra | 1ª votação | +50 |
| 🏆 Estimador Veterano | 10 votações | +100 |
| 🃏 Mestre das Cartas | 50 votações | +250 |
| ⚔️ Aventureiro | 1ª sessão | +75 |
| 🛡️ Companheiro de Guilda | 10 sessões | +200 |
| 🔮 Mente Coletiva | 1 consenso perfeito | +150 |
| ✨ Oráculo da Equipe | 5 consensos perfeitos | +400 |
| 🌟 Lenda Viva | 20 consensos perfeitos | +1000 |

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

`environment.local.ts` e `environment.local.prod.ts` ficam no `.gitignore`, então suas credenciais Firebase nao sobem para o Git.

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
│   │   │   ├── story.model.ts        # Story, cartas Fibonacci, raridades
│   │   │   ├── vote.model.ts         # Vote, VoteResult, calculateVoteResult
│   │   │   └── achievement.model.ts  # ACHIEVEMENTS, AchievementDefinition
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Login, registro, Google OAuth
│   │   │   ├── user.service.ts       # Perfil, XP, conquistas, leaderboard
│   │   │   ├── session.service.ts    # Sessões, histórias, votos (Firestore RT)
│   │   │   └── notification.service.ts # Sistema de toasts
│   │   ├── guards/
│   │   │   └── auth.guard.ts         # authGuard + publicGuard
│   │   └── pipes/
│   │       └── xp-level.pipe.ts      # | xpLevel:'level'|'title'|'progress'
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/                # Tela de login (email + Google)
│   │   │   └── register/             # Registro + seleção de classe RPG
│   │   ├── dashboard/                # Hero, sessões ativas, conquistas
│   │   ├── sessions/
│   │   │   ├── session-create/       # Formulário de nova sessão
│   │   │   └── session-room/         # Sala de votação em tempo real
│   │   ├── profile/                  # Stats, troca de classe, conquistas
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

sessions/
  {sessionId}
    name, description, inviteCode
    hostId, hostName, status, participants[]
    currentStoryId, totalStories, completedStories

    stories/
      {storyId}
        title, description, status, order
        finalEstimate, votingStartedAt, completedAt

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

As credenciais do Firebase em `environment.ts` são **chaves de cliente** (não secret keys) e são necessárias no frontend. Para proteger os dados, as **Regras de Segurança do Firestore** (`firestore.rules`) garantem que cada usuário só escreva seus próprios dados. Não exponha credenciais de **Admin SDK** ou service accounts no frontend.

---

## Licença

MIT
