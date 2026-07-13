# Ficha da loja — Google Play Console

## Descrição curta (até 80 caracteres)
O assistente pessoal que se importa com você: agenda, bem-estar e mais.

## Descrição longa (até 4000 caracteres)

O anjel é o seu assistente pessoal do dia a dia — não só mais uma agenda,
mas alguém que se importa de verdade com como o seu dia está indo.

**Organização de verdade**
Conecte sua agenda do Google e deixe o anjel te lembrar dos compromissos,
sugerir horários e montar o resumo do seu dia — reuniões, refeições e tudo
mais, num só lugar.

**Bem-estar, sem invadir**
Uma vez por dia, o anjel pergunta como você está. Se perceber que o dia tá
difícil, sugere uma pausa, uma playlist mais calma, ou simplesmente escuta.
Nunca diagnostica, nunca substitui ajuda profissional.

**Música pro seu momento**
Conecte o Spotify e receba sugestões de playlist que combinam com o seu tom
do dia — calma quando o dia pesa, energia quando é hora de produzir.

**Leitura em dia**
Acompanhe os livros que está lendo, receba sugestões baseadas no que te
interessa, e lembretes gentis pra voltar a ler.

**Lazer perto de você**
Descubra o que está acontecendo na sua cidade, filtrado pelo que você
realmente gosta.

**Modo Executivo (Pro)**
Pra quem tem uma rotina mais complexa: triagem de e-mail, recados de
telefone transcritos, e organização de viagens — sempre pedindo sua
confirmação antes de qualquer ação.

Sua privacidade em primeiro lugar: você escolhe exatamente o que o anjel
pode acessar, categoria por categoria, e pode apagar tudo a qualquer
momento, direto no app.

## Categoria sugerida
Produtividade

## Data Safety (Formulário de Segurança de Dados)

Preencher em Play Console > App content > Data safety, com base nesta tabela:

| Categoria de dado | Coletado? | Compartilhado? | Finalidade |
|---|---|---|---|
| Localização aproximada | Sim (opcional) | Não | Funcionalidade do app (lazer perto de você) |
| Contatos | Não | Não | — |
| Informações de calendário/agenda | Sim (via OAuth Google) | Não | Funcionalidade do app |
| E-mails (metadados: assunto/remetente) | Sim, se Modo Executivo ativado | Não | Funcionalidade do app |
| Mensagens/notificações do sistema | Sim (Android, opcional) | Não | Funcionalidade do app |
| Informações de saúde/bem-estar (texto do chat) | Sim (opcional) | Sim, com a Anthropic (processamento do chat) | Funcionalidade do app |
| Informações financeiras (lembretes de pagamento) | Sim (valores/vencimentos, sem dado de cartão) | Não | Funcionalidade do app |
| Dados de uso do app | Recomenda-se avaliar conforme analytics escolhido | — | Melhoria do produto |

Todos os dados marcados como "opcional" dependem do usuário ativar a
permissão correspondente na tela de consentimento granular do onboarding.

## URL da Política de Privacidade
Publique `privacy-policy.html` (ex.: GitHub Pages, Netlify, ou qualquer
hospedagem estática) e cole a URL pública no campo correspondente do Play
Console.

## Assets visuais já prontos

Gerados a partir da identidade visual do app (navy + brass + o traço do
"horizonte" — o mesmo motivo do nascer do sol usado no protótipo):

- `assets/icon.png` (1024×1024) — ícone padrão, já referenciado em `app.json`
- `assets/adaptive-icon-foreground.png` + `adaptive-icon-background.png` —
  camadas do ícone adaptativo do Android, também já referenciadas em `app.json`
- `feature-graphic.png` (nesta mesma pasta, 1024×500) — banner de destaque da
  ficha da Play Store (campo "Feature graphic")

Script de geração em `scripts/make_icons.py` (raiz do projeto), caso queira
ajustar cores ou regenerar em outro tamanho — precisa de Python com Pillow
(`pip install pillow`).

**Sobre capturas de tela da loja:** não gerei screenshots simulados de
propósito — a Play Store exige que sejam capturas reais do app rodando, e
usar imagens forjadas pode até causar rejeição na revisão. Depois de rodar
`npx expo start` e navegar pelas telas no celular, é só tirar print direto
(recomendo Onboarding, Conversa e Resumo do dia como as três principais).
