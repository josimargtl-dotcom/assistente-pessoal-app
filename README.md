# anjel — App (React Native / Expo)

Scaffold funcional do MVP: onboarding com consentimento granular (LGPD), navegação
por abas (Conversa, Resumo, Leitura, Executivo, Ajustes), preferências e
consentimentos salvos localmente, e botão "Excluir meus dados".

## O que já funciona
- Onboarding real: permissões, horário de refeições, atividades e interesses são
  salvos no aparelho (`@react-native-async-storage/async-storage`).
- Log de consentimento com data/hora a cada mudança (exigido na seção 5.2 da spec).
- Botão "Excluir meus dados" na aba Ajustes apaga tudo e volta pro onboarding,
  incluindo revogar as conexões com Google Calendar e Spotify.
- Navegação por abas entre as 5 telas do protótipo.
- **Google Calendar real**: conectar/desconectar em Ajustes; a aba Resumo busca
  os compromissos de hoje de verdade e junta com os horários de refeição
  cadastrados no onboarding.
- **Spotify real**: conectar/desconectar em Ajustes; no chat, quando a
  conversa sugere um tom emocional (ex.: "cansado", "estressado"), aparece um
  cartão oferecendo uma playlist de verdade — só busca quando você toca.
- **Chat real**: conversa de verdade com o anjel, via um backend próprio que
  fala com a API da Claude (Anthropic) usando a persona definida na spec.
- **Leitura real**: busca livros de verdade (Google Books API), salva sua
  lista de leitura no aparelho, progresso editável, e sugestão automática com
  base nos interesses cadastrados no onboarding — só mostra sinopse e
  metadados, nunca reproduz o texto do livro.
- **Lazer perto de você**: sugestões reais de lugares (Google Places),
  filtradas pelos interesses do onboarding, na aba Resumo.
- **Modo Executivo real**: triagem de e-mail (Gmail, reaproveitando o login
  do Google), recados de telefone transcritos (Twilio, via backend) e busca
  de voos (Amadeus, via backend).
- **Notification Listener (Android)**: scaffold completo de um módulo nativo
  que lê as notificações do sistema — ver caveat importante abaixo.

## Google Books — passo a passo (opcional, mas recomendado)

A busca funciona sem chave nenhuma, mas com cota bem baixa. Pra uso real:

1. No mesmo projeto do Google Cloud Console usado pro Calendar, ative a
   **Books API** em **APIs e Serviços > Biblioteca**
2. Em **Credenciais**, crie uma **API Key** (não precisa de OAuth — é
   catálogo público)
3. Cole a chave em `src/services/googleBooks.js`, na constante `API_KEY`

## Google Places (lazer perto de você) — passo a passo

1. No mesmo projeto do Google Cloud, ative a **Places API**
2. Crie uma **API Key** e, antes de publicar, **restrinja por assinatura do
   app Android** (SHA-1 + `br.com.anjel.app`) em Credenciais > editar a chave
   — assim ela pode ficar no código do app com segurança
3. Cole a chave em `src/services/places.js`

## Gmail (triagem de e-mail) — passo a passo

Usa o mesmo login do Google Calendar — já pedi o escopo `gmail.readonly`
junto no `GOOGLE_OAUTH.scopes` de `src/services/googleCalendar.js`. Só
precisa:
1. No Google Cloud Console, ativar a **Gmail API**
2. Adicionar o escopo `gmail.readonly` na Tela de consentimento OAuth
   (mesma tela configurada pro Calendar)

Sem nenhum passo extra de credencial — o mesmo Client ID cobre os dois.

## Amadeus (viagens) e Twilio (telefonia) — via backend

Essas duas **não podem** rodar direto no app: ambas exigem client secret
(Amadeus) ou webhook público (Twilio), então moram em `backend/`.

**Amadeus:**
1. Crie uma conta gratuita em https://developers.amadeus.com
2. Crie um app de teste (Self-Service, sandbox) e copie Client ID/Secret
3. Cole em `backend/.env` (`AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`)
4. O sandbox tem dados de teste, não voos reais — pra produção, trocar
   `AMADEUS_BASE` no `backend/index.js` pra URL de produção e pedir acesso
   comercial à Amadeus

**Twilio:**
1. Crie uma conta em https://www.twilio.com e compre/ative um número
2. No console da Twilio, configure o webhook de voz do número pra apontar
   pra `https://SEU-BACKEND/twilio/voice`
3. Cole as credenciais em `backend/.env` (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`)
4. Os recados ficam guardados em memória no backend de exemplo — troque por
   um banco de dados de verdade antes de ir pra produção, ou os recados somem
   a cada reinício do servidor

## Notification Listener — o único item que sai do Expo puro

Criei o scaffold completo em `modules/notification-listener/`: um módulo
nativo Android (Kotlin, usando a Expo Modules API) que implementa um
`NotificationListenerService` e expõe pra o JS:
- `isPermissionGranted()` / `openSettings()` — o Android não tem prompt de
  permissão pra isso, o usuário ativa manualmente numa tela de sistema
- Um evento `onNotificationReceived` com `packageName`, `title` e `text` —
  o mesmo preview que o Android já mostra, nunca o conteúdo interno do app
  (é assim que a spec exige, seção 3.4)

**Importante ser honesto sobre isso:** eu escrevi esse código seguindo o
padrão documentado da Expo Modules API, mas **não consegui compilar nem
testar** — meu ambiente aqui não tem Android SDK/Gradle nem acesso à
internet. Ele deve funcionar, mas é o único pedaço do projeto que eu não
validei de verdade. Antes de confiar nele:

1. Rode `npx expo prebuild -p android` (gera a pasta `android/` nativa)
2. Rode `eas build --profile development --platform android` (ou
   `npx expo run:android` com Android Studio instalado)
3. Se der erro de compilação Kotlin/Gradle, me manda o log exato — é bem mais
   fácil eu corrigir vendo o erro real do que adivinhar

Sem esse módulo compilado (ex.: rodando no Expo Go), a tela de Ajustes
simplesmente mostra "Precisa de um build próprio" e o resto do app continua
funcionando normalmente.

## Google Calendar — passo a passo (Google Cloud Console)

1. Acesse https://console.cloud.google.com e crie um projeto (ex.: "anjel-app")
2. Em **APIs e Serviços > Biblioteca**, ative a **Google Calendar API**
3. Em **APIs e Serviços > Tela de consentimento OAuth**:
   - Tipo: Externo
   - Adicione os escopos `calendar.readonly` e `calendar.events`
   - Enquanto o app não passar pela verificação do Google, adicione seu
     próprio e-mail em "Usuários de teste" pra conseguir logar
4. Em **APIs e Serviços > Credenciais**, crie três Client IDs OAuth 2.0:
   - **Web application** — usado no Expo Go durante o desenvolvimento
   - **Android** — usado no build de produção; precisa do nome do pacote
     (`br.com.anjel.app`, já configurado em `app.json`) e do SHA-1 do
     keystore (pegue com `eas credentials` depois de rodar `eas build:configure`)
   - **iOS** — se for publicar na App Store também
5. Copie os três Client IDs em `src/services/googleCalendar.js`,
   substituindo `SEU_WEB_CLIENT_ID`, `SEU_ANDROID_CLIENT_ID` e `SEU_IOS_CLIENT_ID`

**Sobre testar no Expo Go:** o fluxo OAuth nativo (Android/iOS Client ID) só
funciona em um build próprio do app, não no Expo Go. Pra testar de verdade
antes de gerar o build de produção, rode um "development build":
```bash
eas build --profile development --platform android
```
Isso instala uma versão do anjel no seu celular que já reconhece o esquema de
redirecionamento (`anjel://`) configurado em `app.json`, permitindo o login
completo com o Google.

## Spotify — passo a passo (Spotify Developer Dashboard)

1. Acesse https://developer.spotify.com/dashboard e crie um app
2. Em **Settings** do app, adicione o Redirect URI: `anjel://` (o mesmo
   esquema configurado em `app.json`)
3. Copie o **Client ID** e cole em `src/services/spotify.js`, no lugar de
   `SEU_SPOTIFY_CLIENT_ID`
4. Não precisa de Client Secret: o app usa Authorization Code + PKCE, feito
   pra rodar com segurança em apps mobile sem guardar segredo nenhum
5. Igual ao Google, o login completo só funciona num development build
   (`eas build --profile development`), não no Expo Go

## Chat real — backend próprio (pasta `backend/`)

O app nunca deve guardar a chave da API da Claude no código do celular — por
isso existe um backend simples que fica com a chave e faz a ponte.

1. Entre na pasta `backend/` e rode:
   ```bash
   npm install
   cp .env.example .env
   ```
2. Coloque sua chave da API da Claude (criada em https://console.anthropic.com)
   no arquivo `.env`, no campo `ANTHROPIC_API_KEY`
3. Rode localmente pra testar: `npm start` (sobe em `http://localhost:3000`)
4. Pra funcionar no celular de verdade, esse backend precisa estar publicado
   com HTTPS. Deixei um `render.yaml` pronto na raiz do projeto pra facilitar
   o deploy no Render: em https://dashboard.render.com, escolha "New Blueprint
   Instance", aponte pro seu repositório, e o Render já detecta o
   `render.yaml` e cria o serviço sozinho — só falta preencher as variáveis
   de ambiente marcadas como secretas no painel. Railway e Fly.io também
   funcionam bem, só que sem esse blueprint pronto (configuração manual).
5. Cole essa URL em `src/config.js`, no lugar de `SEU-BACKEND.exemplo.com`

## O que ainda é demo/estático (próximos passos de integração)
- Detecção de humor no chat: hoje é um filtro simples de palavras-chave.
  Uma versão real de produção usaria um modelo de análise de sentimento
  (módulo 3.2 da spec) em vez de checar palavras soltas.
- Gestão de pagamentos: hoje é só um lembrete visual fixo — conciliação
  automática de contas a pagar/receber (spec 4.4) fica pra depois.
- Reserva de viagem: a busca de voos é real (sandbox Amadeus), mas o botão
  "confirmar reserva" ainda não fecha a compra de fato — isso exige
  integração com o checkout da companhia/agência (spec 4.2).
- Notification Listener (ler notificações do sistema): **não é possível no Expo
  managed workflow puro** — exige um módulo nativo Android próprio. Migrar para
  "custom dev client" do Expo ou bare workflow quando for implementar essa parte
  (fase V1.2 do roadmap).

## Rodando localmente
```bash
npm install
npx expo start
```
Escaneie o QR code com o app Expo Go no celular, ou rode `npm run android` com um
emulador/Android Studio instalado.

## Checklist para publicar na Play Store

1. **Conta de desenvolvedor**
   - Criar conta em https://play.google.com/console (taxa única de US$ 25)
   - Recomendado: conta Organização (exige D-U-N-S), por causa dos dados sensíveis
     de saúde/bem-estar e pagamentos que o app trata

2. **Gerar o build de produção**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform android
   ```
   Isso gera o `.aab` (Android App Bundle) assinado, no formato exigido pela loja.

3. **Ficha do app no Play Console**
   - Ícone, capturas de tela, descrição curta/longa — já deixei um rascunho
     pronto em `store/play-store-listing.md`
   - Política de Privacidade publicada em uma URL pública — já deixei a
     página pronta em `store/privacy-policy.html`, só falta hospedar (ex.:
     GitHub Pages, Netlify) e preencher os dois campos `[preencher]` (data e
     e-mail de contato) antes de publicar
   - Formulário de Segurança de Dados (Data Safety) — a tabela de mapeamento
     já está em `store/play-store-listing.md`, junto da descrição

4. **Declaração de permissões sensíveis**
   - Assim que o Notification Listener for implementado, será necessário
     preencher o Formulário de Declaração de Permissões no Play Console e enviar
     um vídeo demonstrando a funcionalidade. Reserve algumas semanas para essa
     revisão estendida.

5. **Monetização**
   - Configurar os produtos de assinatura (Pro e Executivo) em
     Monetize > Products > Subscriptions
   - Vincular perfil de pagamentos do Google com dados fiscais/bancários

6. **Acesso gratuito do criador**
   - Mais simples: cadastrar seu e-mail em Setup > License testing no Play
     Console — assinaturas de teste não geram cobrança real
   - Mais robusto a longo prazo: um campo `is_owner` no backend que libera os
     recursos pagos sem passar pelo checkout (ver seção 7.1 da especificação)

7. **Testes antes de produção**
   - Suba primeiro para a faixa "Internal testing", depois "Closed testing"
     (contas pessoais novas precisam de 12 testers por 14 dias antes de ir pra
     produção)
