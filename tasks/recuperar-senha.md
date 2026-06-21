# Recuperar Senha

## Resumo da feature

Usuários cadastrados com email e senha não têm como recuperar o acesso à conta caso esqueçam a senha. A tela de login atual não oferece nenhum caminho para redefinição. Esta feature adiciona o fluxo completo de recuperação de senha via email, aproveitando o suporte nativo já disponível no provedor de autenticação.

---

## Histórias de Usuário

**US-01**
Como usuário cadastrado com email e senha, quero solicitar a recuperação da minha senha diretamente na tela de login, para que eu possa recuperar o acesso à conta sem precisar criar uma nova.

**US-02**
Como usuário que solicitou a recuperação de senha, quero receber um email com instruções claras para redefinir minha senha, para que eu possa concluir o processo de forma independente.

**US-03**
Como usuário que já clicou em "Esqueci minha senha", quero ter a opção de reenviar o email de recuperação caso não o tenha recebido, para que eu não fique bloqueado por uma falha de entrega.

---

## Critérios de Aceite

### US-01 — Solicitar recuperação na tela de login

**Cenário 1: Acesso ao link de recuperação**
```
Dado que estou na tela de login,
Quando visualizo o formulário de autenticação,
Então devo ver um link ou botão com o texto "Esqueci minha senha"
próximos ao campo de senha.
```

**Cenário 2: Abertura do formulário de recuperação**
```
Dado que estou na tela de login,
Quando clico em "Esqueci minha senha",
Então sou direcionado para uma tela ou estado alternativo
com um campo para informar meu email
e um botão de confirmação para enviar o pedido de recuperação.
```

**Cenário 3: Envio com email válido e cadastrado**
```
Dado que estou na tela de recuperação de senha
e informei um email com formato válido,
Quando confirmo o envio,
Então recebo uma mensagem de sucesso informando que o email foi enviado
e o formulário é ocultado ou bloqueado para evitar reenvios imediatos acidentais.
```

**Cenário 4: Email com formato inválido**
```
Dado que estou na tela de recuperação de senha
e informei um texto que não é um email válido (ex: "usuario@", "nada"),
Quando tento confirmar o envio,
Então o envio é bloqueado
e uma mensagem de validação é exibida abaixo do campo indicando que o email é inválido.
```

**Cenário 5: Estado de carregamento**
```
Dado que estou na tela de recuperação de senha
e informei um email válido,
Quando confirmo o envio,
Então o botão de confirmação é desabilitado e exibe um indicador de carregamento
enquanto a requisição está em andamento.
```

---

### US-02 — Receber email de recuperação

**Cenário 6: Conteúdo do email**
```
Dado que solicitei a recuperação de senha com um email cadastrado,
Quando o email chega na minha caixa de entrada,
Então o email contém um link de redefinição de senha
e o link é válido por no máximo 1 hora.
```

**Cenário 7: Expiração do link**
```
Dado que recebi o email de recuperação de senha
e o link já expirou (mais de 1 hora após o envio),
Quando clico no link,
Então sou informado de que o link expirou
e sou orientado a solicitar um novo email de recuperação.
```

---

### US-03 — Reenviar email de recuperação

**Cenário 8: Opção de reenvio após envio inicial**
```
Dado que já solicitei o envio do email de recuperação
e estou na tela de confirmação de envio,
Quando aguardo ao menos 60 segundos,
Então aparece uma opção para reenviar o email.
```

**Cenário 9: Bloqueio de reenvio imediato**
```
Dado que já solicitei o envio do email de recuperação,
Quando tento reenviar antes de 60 segundos,
Então o botão de reenvio está desabilitado
e um contador regressivo indica quanto tempo falta para liberar o reenvio.
```

---

## Fluxo de Recuperação (ponto de vista do usuário)

1. O usuário está na tela de login e não lembra a senha.
2. Clica no link "Esqueci minha senha", localizado abaixo do campo de senha.
3. É apresentado um formulário com o campo de email e o botão "Enviar instruções".
4. O usuário informa o email da conta e clica em "Enviar instruções".
5. Enquanto o sistema processa, o botão exibe um indicador de carregamento.
6. Ao concluir, a tela exibe uma mensagem de confirmação genérica: o email foi enviado (independente de o email estar cadastrado ou não — ver RN-03).
7. O usuário acessa a caixa de entrada e clica no link recebido.
8. O link abre a página de redefinição de senha (gerenciada pelo próprio provedor de autenticação).
9. O usuário define a nova senha e confirma.
10. O usuário é redirecionado para a tela de login para entrar com a nova senha.

---

## Casos de Borda

| Situação | Comportamento esperado |
|---|---|
| Email informado não está cadastrado | Exibir a mesma mensagem de sucesso genérica — não revelar se o email existe ou não (ver RN-03) |
| Email pertence a uma conta Google (login social) | Exibir mensagem orientando que a conta usa login via Google e não tem senha para recuperar |
| Link de recuperação já utilizado | Provedor invalida o link após o primeiro uso; o usuário deve solicitar um novo |
| Link de recuperação expirado | Informar expiração e oferecer o caminho de volta para solicitar um novo email |
| Falha de rede ao enviar o pedido | Exibir mensagem de erro genérica orientando a verificar a conexão e tentar novamente |
| Muitas solicitações em sequência (rate limiting) | Exibir mensagem amigável informando excesso de tentativas e orientando aguardar alguns minutos |

---

## Regras de Negócio

**RN-01 — Escopo do fluxo**
A funcionalidade de recuperação de senha aplica-se exclusivamente a contas cadastradas com email e senha. Contas criadas via Google não possuem senha gerenciada pelo sistema.

**RN-02 — Validação do campo de email**
O campo de email deve ser validado no cliente antes do envio: formato obrigatório, campo não pode estar vazio. O botão de envio permanece desabilitado enquanto o campo estiver inválido.

**RN-03 — Resposta neutra para email não cadastrado (segurança)**
O sistema não deve revelar se um email está ou não cadastrado. Para qualquer email com formato válido — cadastrado ou não — deve ser exibida a mesma mensagem de sucesso genérica. Isso previne enumeração de contas por terceiros.

**RN-04 — Cooldown de reenvio**
Após o primeiro envio, o usuário deve aguardar ao menos 60 segundos antes de poder solicitar um reenvio. O contador deve ser visível e regressivo.

**RN-05 — Acesso à tela de recuperação**
A rota ou estado de recuperação de senha deve seguir o mesmo controle de acesso do login e registro: usuários autenticados não devem acessá-la e devem ser redirecionados para o dashboard.

**RN-06 — Retorno ao login**
Tanto na tela de confirmação de envio quanto na situação de link expirado, deve haver um link visível para voltar à tela de login.

---

## Personas Envolvidas

| Persona | Papel |
|---|---|
| Usuário não autenticado (cadastro email/senha) | Solicitante principal da recuperação de senha |
| Usuário não autenticado (cadastro Google) | Afetado indiretamente — precisa ser orientado a usar o provedor correto |
| Usuário autenticado | Não é afetado — não tem acesso a esta tela |

---

## Não Escopo

Esta entrega **não inclui**:

- Tela customizada de redefinição de senha hospedada no Planning RPG — o link do email pode direcionar para a página padrão do provedor de autenticação
- Qualquer alteração no fluxo de login com Google
- Funcionalidade de "alterar senha" para usuários já autenticados (escopo de perfil/configurações)
- Validação de força de senha no momento da redefinição (responsabilidade da página do provedor)
- Notificação por SMS ou outros canais além de email
- Log ou histórico de solicitações de recuperação no perfil do usuário

---

## Dúvidas em Aberto

1. **Template do email**: o email de recuperação deve usar o template padrão do provedor de autenticação ou o time deseja configurar um template customizado com a identidade visual do Planning RPG (nome do produto, ícone espada, etc.)?

2. **Rota da tela de recuperação**: a recuperação de senha deve ser uma rota própria (ex: `/auth/recuperar-senha`) ou um estado alternativo dentro da própria tela de login, sem mudança de URL? A escolha impacta navegação pelo botão "voltar" do browser.

3. **Comportamento pós-redefinição**: após o usuário redefinir a senha com sucesso na página do provedor, ele deve ser redirecionado diretamente para o dashboard ou para a tela de login para autenticar novamente com a nova senha?
