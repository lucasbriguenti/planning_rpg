# Planning RPG — CLAUDE.md

## Visão Geral

Planning Poker gamificado com temática RPG. Angular 21 (NgModule) + Firebase SDK puro no frontend. Sem backend próprio — toda a persistência é via Firestore em tempo real.

## Comandos

```bash
ng serve          # dev server em http://localhost:4200
ng build          # build de produção em dist/planning_rpg
firebase deploy   # deploy no Firebase Hosting (requer build antes)
firebase deploy --only firestore  # atualiza só regras/índices
```

## Stack

- **Angular 21** — NgModule (não standalone no root), componentes de feature são standalone e lazy-loaded
- **Firebase SDK 10+** — `firebase/firestore` e `firebase/auth` diretos, **sem `@angular/fire`**
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
| `UserService` | Perfil, XP, conquistas, leaderboard |
| `SessionService` | Sessões, histórias, votos (tudo real-time via `onSnapshot`) |
| `NotificationService` | Toasts / achievements (BehaviorSubject local) |

### Observables do Firestore

Os serviços usam `onSnapshot` encapsulado em `Observable` — **nunca** use `collectionData`/`docData` do AngularFire (foi removido). Padrão:

```typescript
return new Observable(observer => {
  const unsub = onSnapshot(query, snap => observer.next(...), err => observer.error(err));
  return () => unsub(); // cleanup ao unsubscribe
});
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
│   │   ├── services/       # firebase, auth, user, session, notification
│   │   ├── guards/         # authGuard, publicGuard (usam FirebaseService)
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
│   ├── environment.ts      # credenciais Firebase (dev)
│   └── environment.prod.ts # credenciais Firebase (prod)
└── styles/
    ├── _variables.scss     # paleta, tipografia, espaçamentos
    └── _animations.scss    # keyframes RPG
```

## Modelo de Dados (Firestore)

```
users/{uid}
  displayName, email, characterClass, xp, level
  totalVotes, totalSessions, perfectConsensus
  achievements: [{ id, name, icon, unlockedAt }]

sessions/{sessionId}
  name, description, inviteCode, hostId, hostName
  status: 'waiting' | 'active' | 'completed'
  participants[], currentStoryId, totalStories, completedStories

  stories/{storyId}
    title, description, status, order, finalEstimate

    votes/{uid}
      userId, userName, characterClass, value
```

## Regras de Segurança

Definidas em `firestore.rules`. Para aplicar:

```bash
firebase deploy --only firestore
```

## Decisões Importantes

- **Sem `@angular/fire`**: foi removido por incompatibilidade com Angular 21 (`inject(Firestore)` retornava wrapper inválido). Use sempre `firebase/firestore` e `firebase/auth` diretos.
- **Sem `orderBy` em `getUserSessions`**: evita dependência de índice composto. Ordenação feita no cliente por `createdAt.seconds`.
- **`XpLevelPipe` no AppModule**: pipe não-standalone declarado e re-exportado pelo AppModule para uso no template `app.html`.
- **Componentes feature são standalone**: lazy-loaded via `loadComponent` no router. O AppModule não os declara.
- **Firestore demora na primeira conexão**: o WebChannel pode levar 5-10s no cold start. Não use `timeout()` nos observables de sessões.
