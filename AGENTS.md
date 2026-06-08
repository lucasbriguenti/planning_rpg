# Planning RPG

## Visão Geral

Planning Poker gamificado com temática RPG. Angular 21 (NgModule) + Firebase SDK puro no frontend. Sem backend próprio — toda a persistência é via Firestore em tempo real. Integração opcional com Azure DevOps para importar work items.

## Comandos

```bash
ng serve          # dev server em http://localhost:4200
ng build          # build de produção em dist/planning_rpg
firebase deploy   # deploy no Firebase Hosting (requer build antes)
firebase deploy --only firestore  # atualiza só regras/índices
```

## Stack

- **Angular 21.2** — NgModule (não standalone no root), componentes de feature são standalone e lazy-loaded
- **Firebase SDK 12.14** — `firebase/firestore` e `firebase/auth` diretos, **sem `@angular/fire`**
- **RxJS 7.8** — Observables + Signals (híbrido: signal/computed nos componentes, Observable nos serviços)
- **TypeScript 5.9**
- **SCSS** com `@use` modular — variáveis em `src/styles/_variables.scss`

## Arquitetura

### Inicialização do Firebase

Toda a inicialização está em um único lugar:

```
src/app/core/services/firebase.service.ts
```

`FirebaseService` é um singleton (`providedIn: 'root'`) que expõe `db` (Firestore) e `auth` (Auth). Todos os outros serviços injetam `FirebaseService` — nunca chame `initializeApp` em outro lugar.

### Serviços principais

| Serviço | Responsabilidade |
|---|---|
| `FirebaseService` | Inicializa Firebase, expõe `db` e `auth` |
| `AuthService` | Login, registro, Google OAuth, `currentUser$()` |
| `UserService` | Perfil, XP, conquistas, leaderboard, config Azure |
| `SessionService` | Sessões, histórias, votos (tudo real-time via `onSnapshot`) |
| `NotificationService` | Toasts / achievements (BehaviorSubject local) |
| `AzureService` | Busca work items no Azure DevOps via PAT |

### Observables do Firestore

Os serviços usam `onSnapshot` encapsulado em `Observable` — **nunca** use `collectionData`/`docData` do AngularFire (foi removido). Padrão:

```typescript
return new Observable(observer => {
  const unsub = onSnapshot(query, snap => observer.next(...), err => observer.error(err));
  return () => unsub(); // cleanup ao unsubscribe
});
```

### Estado nos componentes

Use **signals** para estado local e computed values — callbacks do Firebase escapam da Zone.js e não disparam change detection com `async` pipe:

```typescript
// serviço → Observable; componente → signal
readonly stories = signal<Story[]>([]);
readonly pendingStories = computed(() => this.stories().filter(s => s.status === 'pending'));

this.sessionService.getStories(id).subscribe(s => this.stories.set(s));
```

### Autenticação nos componentes

Use `AuthService.currentUser$()` — não importe nada do `@angular/fire/auth`. Para pegar o usuário uma única vez:

```typescript
this.authService.currentUser$().pipe(take(1)).subscribe(user => { ... });
```

## Estrutura de Arquivos

```
src/
├── app/
│   ├── core/
│   │   ├── models/         # user, session, story, vote, achievement
│   │   ├── services/       # firebase, auth, user, session, notification, azure
│   │   ├── guards/         # authGuard, publicGuard (funções CanActivateFn)
│   │   └── pipes/          # XpLevelPipe (declarado no AppModule)
│   ├── features/           # componentes standalone, lazy-loaded
│   │   ├── auth/login|register
│   │   ├── dashboard/
│   │   ├── sessions/session-create|session-room
│   │   ├── profile/
│   │   └── leaderboard/
│   ├── app-module.ts       # NgModule raiz — sem providers do Firebase
│   ├── app-routing-module.ts
│   └── app.ts              # componente raiz (não standalone)
├── environments/
│   ├── environment.ts         # re-exporta environment.local.ts
│   ├── environment.local.ts   # credenciais Firebase (dev, não comitar)
│   └── environment.prod.ts    # credenciais Firebase (prod)
└── styles/
    ├── _variables.scss     # paleta, tipografia, espaçamentos
    └── _animations.scss    # keyframes RPG
```

## Modelo de Dados (Firestore)

```
users/{uid}
  displayName, email, photoURL?, characterClass, xp, level
  totalVotes, totalSessions, perfectConsensus
  achievements: [{ id, name, icon, unlockedAt }]
  createdAt, updatedAt

  private/azure                   ← subcoleção para segredos
    pat, organization, project, updatedAt

sessions/{sessionId}
  name, description?, inviteCode, hostId, hostName
  status: 'waiting' | 'active' | 'completed'
  participants: Participant[]
  currentStoryId?, totalStories, completedStories
  createdAt, updatedAt

  stories/{storyId}
    title, description?, category?: 'back' | 'front'
    status: 'pending' | 'voting' | 'revealed' | 'completed'
    finalEstimate?, averageEstimate?, order
    votingStartedAt?, completedAt?, createdAt

    votes/{uid}
      userId, userName, characterClass
      value: number | string   ← string para '?' e '☕'
      sessionId, storyId, createdAt
```

## Sistema de XP e Níveis

- Fórmula: `xpForLevel(n) = 100 * 1.5^(n-1)` (exponencial)
- Títulos: Iniciante (1) → Aventureiro (2) → Herói (3) → Campeão (4) → Lendário (5) → Mestre (6) → Grão-Mestre (7) → Arquimago (8) → Semideus (9) → Imortal (10)
- Eventos que concedem XP: voto (+10), criar sessão (+25), conquista desbloqueada (variável), consenso perfeito (+50)

## Ponderação de Votos

Votos são ponderados por classe + categoria da história:

| Classe | Back | Front | Neutro |
|---|---|---|---|
| Mage | 1.2× | 0.8× | 1.0× |
| Warrior | 0.8× | 1.2× | 1.0× |
| Paladin | 1.2× | 1.2× | 1.2× |
| Archer | 1.2× | 1.2× | 1.2× |
| Peasant | 0.8× | 0.8× | 0.8× |

## Cartas de Votação

28 cartas: 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, `?`, `☕`  
Raridades: common, uncommon, rare, epic, legendary, special (afetam estilo visual via `.badge`).

## Integração Azure DevOps

Fluxo: usuário salva PAT + organização + projeto em `users/{uid}/private/azure` via `UserService.saveAzureConfig()`. Na session-room, host importa work item pelo ID — `AzureService.getWorkItem()` chama a REST API com Basic Auth (PAT). Erros tratados: 401 (PAT inválido), 404 (item não encontrado).

## Regras de Segurança

`firestore.rules` atual: qualquer usuário autenticado pode ler/escrever tudo. Sem RBAC por enquanto. Para aplicar:

```bash
firebase deploy --only firestore
```

## Decisões Importantes

- **Sem `@angular/fire`**: foi removido por incompatibilidade com Angular 21 (`inject(Firestore)` retornava wrapper inválido). Use sempre `firebase/firestore` e `firebase/auth` diretos.
- **Signals nos componentes**: Firebase callbacks escapam da Zone.js — usar `signal()` + `computed()` em vez de propriedades simples para garantir re-render correto.
- **Sem `orderBy` em `getUserSessions`**: evita dependência de índice composto. Ordenação feita no cliente por `createdAt.seconds`.
- **`XpLevelPipe` no AppModule**: pipe não-standalone declarado e re-exportado pelo AppModule para uso no template `app.html`.
- **Componentes feature são standalone**: lazy-loaded via `loadComponent` no router. O AppModule não os declara.
- **Firestore demora na primeira conexão**: o WebChannel pode levar 5-10s no cold start. Não use `timeout()` nos observables de sessões.
- **Config Azure em subcoleção `private`**: PAT é dado sensível — armazenado em `users/{uid}/private/azure`, não no documento principal do usuário.
