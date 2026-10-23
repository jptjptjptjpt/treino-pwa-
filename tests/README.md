# Suíte headless do modo treino

Testes de ponta a ponta do PWA (`index.html` + `app.js`) rodando em um Chromium
headless de verdade, contra um mock em memória da API v2 do wger e do allauth
headless. Sem dependências npm: só Node 18+ e um Chromium/Chrome instalado.

O objetivo é cobrir o que dá errado com mais frequência no uso na academia —
prescrição por iteração, edição de série já registrada, RIR, cardio, descanso,
cronômetros, consolidação no "Concluir", cancelamento do treino, idiomas e
layout em 360 px — e falhar com `exit != 0` quando algo regride.

## Rodar

```sh
cd treino-pwa
node tests/run.js
```

Saída: uma linha `PASS`/`FAIL` por verificação, o resumo `N/M verificações OK`
e, em caso de falha, a lista de verificações quebradas com o valor esperado e o
obtido. Código de saída `0` quando tudo passa, `1` quando alguma verificação
falha e `2` quando um cenário quebra por exceção (timeout, elemento ausente).

Requisitos:

- Node 18 ou mais novo (`fetch` e `WebSocket` nativos; testado no 22).
- Chromium ou Chrome. O binário é procurado no `PATH` (`chromium`,
  `chromium-browser`, `google-chrome`, `google-chrome-stable`); para apontar
  outro, use `CHROMIUM=/caminho/do/binário node tests/run.js`.

Portas (todas em `127.0.0.1`, sobrescrevíveis por variável de ambiente):

| Variável | Padrão | Para quê |
|---|---|---|
| `APP_PORT` | `8891` | servidor estático que serve a raiz do repo |
| `MOCK_PORT` | `8890` | mock da API v2 + allauth |
| `CDP_PORT` | `9334` | porta de depuração do Chromium |

O perfil do Chromium é um diretório temporário criado a cada execução e apagado
no `finally`, junto com o processo do navegador e os dois servidores. Uma
execução completa leva cerca de 20 s.

## Como está organizado

| Arquivo | Papel |
|---|---|
| `lib.js` | infraestrutura: servidor estático, descoberta e subida do Chromium, cliente CDP mínimo, relógio fixo, criação/fechamento de aba, `evaluate`/`waitFor` e o contador de verificações |
| `mock.js` | mock da API: rotinas, sequências computadas, traduções, logs e endpoints de controle (`/__log`, `/__reset`, `/__fail`) |
| `run.js` | os cenários (`c0Login` … `c11ExtendedMobile`), os helpers de interação e o `main()` que sobe tudo, roda na ordem e decide o código de saída |

### Mock da API

Dados fixos, pensados para os cenários:

- **Rotinas**: `1 Rotina A — Força`, `2 Rotina B — Cardio`, `3 Rotina C —
  Descanso`, mais `9 Template — Full Body` com `is_template: true` — que só
  aparece na listagem quando o app **não** manda `is_template=false`. O cenário
  de login usa isso para provar que o filtro foi aplicado.
- **Sequência da rotina 1**: dois dias. `2026-10-23` (iteração 1, dia 11):
  3×8 de supino a 50 kg, descanso 40 s, RIR 2, superset rosca 30 kg + tríceps
  20 kg e um aquecimento com peso nulo. `2026-10-24` (iteração 2, dia 12):
  51,25 kg, descanso 80 s, RIR 1.
- **Sequência da rotina 2**: um dia de cardio (iteração 3, dia 30), slot 600,
  exercício 20, alvo de 10 min, unidade 4 (minutos).
- **Sequência da rotina 3**: um dia `is_rest`.
- **Traduções**: pt-BR para os exercícios 10–13 e 20; inglês (`language=2`) e
  espanhol (`language=4`) só para o 10 — é assim que o cenário de idiomas
  confere o fallback pt-BR dos demais.
- **Último log**: `GET /workoutlog/?exercise__in=...` devolve um log antigo de
  45 kg no exercício 10, para provar que a prescrição da iteração vence o
  histórico.
- **Escrita**: `POST /workoutlog/` devolve ids a partir de `1000`;
  `POST /workoutsession/` devolve `900`; `PATCH`/`DELETE` respondem 200/204.
- **Login**: aceita `teste`/`segredo` e devolve um token no formato do allauth
  headless; qualquer outra credencial recebe 400 com a mensagem real do allauth.

Endpoints de controle (fora de `/api`):

| Rota | Efeito |
|---|---|
| `GET /__log` | `{ entries, token }`: todas as requisições vistas, na ordem, com método, caminho (com query) e corpo JSON |
| `GET /__reset` | limpa o log, as falhas programadas e reinicia os ids |
| `POST /__fail` | programa falhas: `{ method, match, count, status }` — as próximas `count` requisições cujo caminho contenha `match` respondem `status` |

### Determinismo

Cada aba recebe, via `Page.addScriptToEvaluateOnNewDocument`, um `Date`
substituído por um relógio **fixo no dia do cenário** (`isoDate + T10:00:00Z`)
que avança em tempo real. Assim a tela sempre abre na mesma data da sequência
do mock (as datas são conferidas em horário local) sem congelar cronômetros e
descanso — o teste de descanso regressivo depende de o tempo andar. O fuso do
navegador é fixado em `America/Sao_Paulo` via
`Emulation.setTimezoneOverride`, então a suíte roda igual em qualquer máquina.
O mesmo script força `window.confirm` a responder `true`.

Cada cenário abre uma **aba nova** (`/json/new`) e limpa
`service_workers,cache_storage,local_storage` para a origem do app, então o
service worker não serve versões antigas e o `localStorage` começa vazio. Para
testar retomada, o reload acontece dentro da mesma aba.

## Cenários

| Cenário | Cobre |
|---|---|
| `C0` | login: validação local sem requisição, credencial inválida com a mensagem traduzida, login válido, lista sem templates, `POST` de login e filtro `is_template=false` na API |
| `C1` | rotina de força na iteração 1: valores por série (kg, reps, RIR), chip do esquema, superset, progresso, cronômetro que avança, confirmação de série (`POST` com `iteration`, alvos e `rir`), descanso 40 s, edição de kg com `PATCH` só do campo alterado, retomada após reload, `DELETE` ao desfazer |
| `C2` | iteração 2 em sessão nova (`2026-10-24`): peso 51,25, descanso 1:20, RIR 1, `iteration: 2` no `POST` |
| `C3` | cardio: tempo e distância, `POST` por parte, `PATCH` ao editar, `DELETE` ao limpar, `iteration` do dia |
| `C4` | cancelar treino de cardio: `DELETE` das duas partes do log e da sessão |
| `C5` | cancelar treino de força: "Voltar" e clique no fundo mantêm a sessão; confirmar apaga os dois logs e a sessão, limpa o rascunho, para cronômetro e descanso, esconde as ferramentas e mostra o toast |
| `C6` | dia de descanso: aviso, sem blocos, "Concluir" desabilitado e ferramentas escondidas |
| `C7` | idiomas: pt-BR → inglês → espanhol → pt-BR no seletor das rotinas, com tela de treino, nomes traduzidos, fallback pt-BR, `<html lang>`, `localStorage` e persistência após reload |
| `C8` | viewport 360×800: sem overflow horizontal nas rotinas, no treino e na folha de cancelamento; botões "Cancelar treino", "Concluir" e o painel do sheet dentro da tela |
| `C9` | menu "⋯": abre no toque, itens e estados do toggle, link para a interface web completa em nova aba sem `opener`, fecha com Escape e com clique fora, presente também no histórico |
| `C10` | modo estendido em 1280×900: persiste a escolha, rotinas em 2+ colunas, treino em duas colunas com a coluna lateral (séries e cronômetros), sem overflow, desliga e volta ao cartão |
| `C11` | modo estendido ligado em 360×800 continua mobile: menu oculto, uma coluna, coluna lateral oculta e séries dentro do exercício |

## Adicionar um cenário

1. Se precisar de dados novos, acrescente-os em `mock.js` (sequências, rotinas,
   traduções). Prefira reutilizar as rotinas existentes: os ids e as datas já
   são referência nos outros cenários.
2. Escreva `async function c9Algo()` em `run.js` seguindo os existentes:
   `await resetMock()`, `const s = await openSession({ date: '2026-10-23' })`,
   corpo com `read(s)`/`click`/`fillSet`/`clickSet`/`waitFor`, e `finally { await
   close(s) }`.
3. Use `check(nome, condição, detalhe)` para verificações pontuais e
   `checkEq`/`checkIncludes` para comparações; o nome deve começar pelo id do
   cenário (`C9 ...`).
4. Chame a função nova em `main()`, depois dos cenários existentes.
5. Rode `node tests/run.js` até `N/N verificações OK`.

Para esperar a rede, prefira `waitPostLogs(n)`/`waitPatchLogs(n)` (contam
requisições no `/__log`) a `sleep` fixo; `sleep` fica para animações e para o
relógio andar (`C1` espera 2,2 s para ver o cronômetro mudar).
